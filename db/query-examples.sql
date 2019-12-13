CREATE EXTENSION pgrouting;

-- Optimalization
create index r_tree_polygon_way on planet_osm_polygon using gist((st_transform(way, 4326)));
create index r_tree_point_way on planet_osm_point using gist((st_transform(way, 4326)));
create index r_tree_verticies_geom on ways_vertices_pgr using gist((st_transform(the_geom, 4326)));
create index r_tree_ways_geom on ways using gist((st_transform(the_geom, 4326)));

create index r_tree_polygon_way_geogr on planet_osm_polygon using gist((st_transform(way, 4326)::geography));
create index r_tree_point_way_geogr on planet_osm_point using gist((st_transform(way, 4326)::geography));
create index r_tree_verticies_geom_geogr on ways_vertices_pgr using gist((st_transform(the_geom, 4326)::geography));
create index r_tree_ways_geom_geogr on ways using gist((st_transform(the_geom, 4326)::geography));

create index place_polygon on planet_osm_polygon(place);
create index id_polygon on planet_osm_polygon(osm_id);
create index id_point on planet_osm_point(osm_id);
create index amenity_name_polygon on planet_osm_polygon(amenity, name);
create index aeroway_landuse_polygon on planet_osm_polygon(aeroway, landuse);
create index shop_point on planet_osm_point(shop);
create index ways_id on ways(gid)
create index ways_geom on ways(the_geom)

--drop index amenity_polygon
--drop index r_tree_verticies_geom
--drop index r_tree_verticies_geom_geogr;
--drop index r_tree_point_way;
--drop index r_tree_polygon_way;




----------------------------
-- 1. SCENARIO
----------------------------
with quarters as (
	select st_transform(way, 4326) as geo, way, way_area as area, place, name, osm_id as id,
		st_distance(st_transform(way, 4326), ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')) as distance
	from planet_osm_polygon p
	where p.place in ('quarter', 'suburb', 'village')
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geography, 50000)
),
airports as (
	select st_transform(way, 4326) as geo, name, aeroway, way  from planet_osm_polygon p
	where aeroway in ('aerodrome') and (landuse <> 'military' or landuse is null)
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geography, 50000)
),
closestairports as (
	select air.* from quarters q, lateral (
		select q.id as qid, a.*, st_distance(q.way, a.way) as airport_distance from airports a
		order by q.way <-> a.way
		limit 1
	) air
), schools as (
	select q.id as qid, COUNT(scho.osm_id) as schools from quarters q
	join (select st_transform(way, 4326) as geo, name, shop, * from planet_osm_polygon
		where amenity = 'school' and name is not null
		and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geography, 50000)
	) scho on ST_Contains(q.way, scho.way)
	group by q.id
), shops as (
	select q.id as qid, COUNT(shop.osm_id) as shops  from quarters q
	join (select st_transform(way, 4326) as geo, way, name, shop, osm_id from planet_osm_point
		where shop in ('department_store', 'general', 'kiosk', 'mall', 'supermarket', 'wholesale')
		and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geography, 50000)
  	) shop on ST_Contains(q.way, shop.way)
	group by q.id
),
mergedquarters as (
	select q.geo, q.way, q.id, q.name, q.area,
		CASE
			when q.distance>10000 then 10000 else COALESCE(q.distance, 10000)
		END as distance,
		CASE
			when ca.airport_distance>20000 then 20000 else COALESCE(ca.airport_distance, 20000)
		END as airprt,
		COALESCE(schools, 0) as schls,
		COALESCE(shops, 0) as shps
	from quarters q
	left join schools s on s.qid=q.id
	left join shops sh on sh.qid=q.id
	left join closestairports ca on ca.qid=q.id
)
select ST_AsGeoJSON(q.geo) as wayGeo, q.geo, q.id, q.name, q.area, q.schls as schools, q.airprt as airportDistance, q.shps as shops, q.distance,
 (((10000 - distance) / 250) + schls * 3 + shps + (20000 - airprt)/2000) as score from mergedquarters q order by score desc







----------------------------
-- 2. SCENARIO
----------------------------


explain analyze
with workNearestPoint as (
	select v.id, v.the_geom from ways_vertices_pgr v
	order by st_transform(v.the_geom, 4326) <-> ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')
	limit 1
),
startline as (
	select st_makeline(ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geometry, v.the_geom) as strtline from workNearestPoint v
),
areaCentroid as (
	select ST_Centroid(st_transform(p.way, 4326)) as geo from planet_osm_polygon p
	where p.osm_id = -5473394
	limit 1
),
selectedAreaPoint as (
	select vert.id from areacentroid a
	join LATERAL (
		select * from ways_vertices_pgr v
		order by st_transform(v.the_geom, 4326) <-> a.geo
		limit 1
	) vert on true
	limit 1
),
pointids as (
	select * from (
		VALUES
			((select max(id) from worknearestpoint)),
			((select max(id) from selectedareapoint))
	) as points (id)
),
line as (
	select w.the_geom, id2 AS edge, pgr.* FROM pgr_dijkstra(
		'SELECT gid as id, source, target, cost FROM ways',
		(select min(id) from pointids)::integer, (select max(id) from pointids)::integer, false, false
	) pgr inner join ways w on w.gid=pgr.id2
	union
	values ((select * from startline), 0, 0, null::bigint, null::bigint, 0, 0)
),
multiline as (
	select st_linemerge(st_multi(st_collect(the_geom))) as geo from line
),
shops as (
	select st_multi(st_collect(st_transform(way, 4326))) as geo from planet_osm_point
	where shop in ('department_store', 'general', 'kiosk', 'mall', 'supermarket', 'wholesale')
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(12.450698 41.824625)')::geography, 50000)
	and st_dwithin((select * from multiline)::geography, st_transform(way, 4326)::geography, 300)
)
select ST_AsGeoJSON(m.geo) as line, m.geo, ST_AsGeoJSON(s.geo) as shops from multiline m
	join shops s on true





explain analyze
select p.* FROM pgr_drivingDistance(
	'SELECT gid as id, source, target, cost FROM ways',
	146643, 308269
) p left join ways w on w.gid=p.edge

-- Airport

select w.the_geom, p.* FROM pgr_dijkstra(
	'SELECT gid as id, source, target, cost FROM ways',
	100, 185
) p inner join ways w on w.gid=p.edge;

-- Routing
select * from ways
limit 1000

select * from ways_vertices_pgr
limit 1000




