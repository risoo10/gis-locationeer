const express = require('express');
const router = express.Router();
const pool = require('../query-pool').pool;


router.post('/', function (req, res, next) {
    let {geoN, geoE, diameter} = req.body || {};

    if (!geoN || !geoE || !diameter) {
        res.status(400).send('Bad request');
        return;
    } else {
        const query = `
with quarters as (
	select st_transform(way, 4326) as geo, way, way_area as area, place, name, osm_id as id, 
		st_distance(st_transform(way, 4326), ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')) as distance
	from planet_osm_polygon p
	where p.place in ('quarter', 'suburb', 'village')
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geography, ${diameter * 1000})
),
airports as (
	select st_transform(way, 4326) as geo, name, aeroway, way  from planet_osm_polygon p
	where aeroway in ('aerodrome') and (landuse <> 'military' or landuse is null)
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geography, ${diameter * 1000})
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
		and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geography, ${diameter * 1000})
	) scho on ST_Contains(q.way, scho.way)
	group by q.id
), shops as (
	select q.id as qid, COUNT(shop.osm_id) as shops  from quarters q
	join (select st_transform(way, 4326) as geo, way, name, shop, osm_id from planet_osm_point
		where shop in ('department_store', 'general', 'kiosk', 'mall', 'supermarket', 'wholesale')
		and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geography, ${diameter * 1000})
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
select ST_AsGeoJSON(q.geo) as wayGeo, q.id, q.name, q.area, q.schls as schools, q.airprt as airportDistance, q.shps as shops, q.distance,
 (((10000 - distance) / 250) + schls * 3 + shps + (20000 - airprt)/2000) as score from mergedquarters q order by score desc`;
        console.log('[LOCATION] quarters', query, [geoE, geoN, diameter * 1000]);
        pool.query(query, (errors, results) => {

            if (errors || !results || !results.rows || results.rows.length === 0) {
                console.log(errors);
                res.status(404).send();
            } else {
                res.status(200).json(results.rows);
            }

        });

    }

});

router.post('/route', (req, res) => {
    let {geoN, geoE, diameter, quarterId} = req.body || {};

    if (!geoN || !geoE || !diameter || !quarterId) {
        res.status(400).send('Bad request');
        return;
    } else {
        const query = `
with workNearestPoint as (
	select v.id, v.the_geom from ways_vertices_pgr v
	order by st_transform(v.the_geom, 4326) <-> ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')
	limit 1
),
startline as (
	select st_makeline(ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geometry, v.the_geom) as strtline from workNearestPoint v
),
areaCentroid as (
	select ST_Centroid(st_transform(p.way, 4326)) as geo from planet_osm_polygon p
	where p.osm_id = ${quarterId}
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
	select w.the_geom, pgr.* FROM pgr_dijkstra(
		'SELECT gid as id, source, target, cost FROM ways',
		(select min(id) from pointids), (select max(id) from pointids)
	) pgr inner join ways w on w.gid=pgr.edge
	union
	values ((select * from startline), 0, 0, null::bigint, null::bigint, 0, 0)
),
multiline as (
	select st_linemerge(st_multi(st_collect(the_geom))) as geo from line
),
shops as (
	select st_multi(st_collect(st_transform(way, 4326))) as geo from planet_osm_point
	where shop in ('department_store', 'general', 'kiosk', 'mall', 'supermarket', 'wholesale')
	and st_dwithin(st_transform(way, 4326)::geography, ST_GeogFromText('SRID=4326;POINT(${geoE} ${geoN})')::geography, ${diameter * 1000})
	and st_dwithin((select * from multiline)::geography, st_transform(way, 4326)::geography, 300)
)
select ST_AsGeoJSON(m.geo) as line, ST_AsGeoJSON(s.geo) as shops from multiline m
	join shops s on true
        `;
        console.log('[ROUTE] routeQuery', query, [geoE, geoN, diameter * 1000]);
        pool.query(query, (errors, results) => {

            if (errors || !results || !results.rows || results.rows.length === 0) {
                console.log(errors);
                res.status(404).send();
            } else {
                res.status(200).json(results.rows);
            }

        });
    }


});


module.exports = router;