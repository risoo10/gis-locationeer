import React, {Component} from 'react';
import mapboxgl from 'mapbox-gl';
import PropTypes from "prop-types";
import {MAP_IDS} from "../../constants";
import workIcon from '../../icons/work.png';
import shopIcon from '../../icons/location.png';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mapLoaded: false
        }
    }


    componentDidMount() {
        this.loadMap();
    }

    componentWillUnmount() {
        this.map.remove();
    }


    loadMap() {
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [12.450698, 41.824625],
            zoom: [10]
        });

        this.map.on('load', () => {
            this.setState({
                mapLoaded: true
            });
            this.map.addSource(
                MAP_IDS.AREA_SOURCE, {
                    type: 'geojson',
                    data: this.getAreaStoreData(this.props.geoJsonAreas)
                }
            );

            this.map.addSource(MAP_IDS.SELECTED_AREA_SOURCE, {
                type: 'geojson',
                data: this.getSelectedAreaData(),
            });

            this.map.addLayer({
                id: MAP_IDS.SELECTED_AREA_LAYER,
                type: 'fill',
                source: MAP_IDS.SELECTED_AREA_SOURCE,
                layout: {},
                paint: {
                    "fill-color": '#f44366',
                    'fill-opacity': 0.3,
                }
            });

            this.map.addLayer({
                id: MAP_IDS.AREAS_LAYER,
                type: 'fill',
                source: MAP_IDS.AREA_SOURCE,
                layout: {},
                paint: {
                    "fill-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "score"],
                        0, "#1c6ff8",
                        30, "#31DB92",
                        70, "#fef720"
                    ],
                    'fill-opacity': 0.25,
                    'fill-outline-color': 'black',

                }
            });

            this.map.loadImage(workIcon, (error, imageData) => {
                if (!error) {
                    this.map.addImage(MAP_IDS.WORK_ICON_IMAGE, imageData);
                    this.updateWorkIconSource();
                    this.map.addLayer({
                        id: MAP_IDS.WORK_ICON_LAYER,
                        type: 'symbol',
                        source: MAP_IDS.WORK_ICON_SOURCE,
                        layout: {
                            'icon-image': MAP_IDS.WORK_ICON_IMAGE,
                            'icon-size': 0.1,
                            'icon-allow-overlap': true,
                        }
                    });
                }
            });

            this.map.loadImage(shopIcon, (error, imageData) => {
                if (!error) {
                    this.map.addImage(MAP_IDS.SHOP_IMAGE, imageData);
                    this.map.addSource(MAP_IDS.SHOPS_SOURCE, {
                        type: 'geojson',
                        cluster: false,
                        data: null,
                    });
                    this.map.addLayer({
                        id: MAP_IDS.SHOPS_LAYER,
                        type: 'symbol',
                        source: MAP_IDS.SHOPS_SOURCE,
                        layout: {
                            'icon-image': MAP_IDS.SHOP_IMAGE,
                            'icon-size': 0.07,
                        }
                    });
                }
            });

            this.map.addSource(MAP_IDS.ROUTE_SOURCE, {
                type: 'geojson',
                data: this.props.route,
            });

            this.map.addLayer({
                id: MAP_IDS.ROUTE_LAYER,
                type: 'line',
                source: MAP_IDS.ROUTE_SOURCE,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#888',
                    'line-width': 5
                }

            })
        });
    }

    componentDidUpdate(prevProps) {
        if (this.state.mapLoaded) {
            if (prevProps.geoJsonAreas !== this.props.geoJsonAreas) {
                this.map && this.updateAreaSource();
            }

            if (prevProps.selectedQuarter !== this.props.selectedQuarter) {
                this.map && this.map.getSource(MAP_IDS.SELECTED_AREA_SOURCE).setData(this.getSelectedAreaData());
            }


            if (prevProps.workLocation !== this.props.workLocation) {
                this.map && this.updateWorkIconSource();
                // console.log(JSON.stringify(this.getWorkLocationSourceData()));
            }

            if (prevProps.route !== this.props.route) {
                this.map && this.updateRouteSource();
            }

            if (prevProps.shops !== this.props.shops) {
                this.map && this.updateShopsSource();
            }
        }
    }

    updateRouteSource() {
        this.map.getSource(MAP_IDS.ROUTE_SOURCE).setData(this.props.route || []);
    }

    updateShopsSource() {
        const coordinates = this.props.shops ? this.props.shops : [];
        const newData = this.props.shops && {
            type: 'FeatureCollection',
            features: coordinates.map((coord) => {
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [...coord]
                    }
                }
            })
        };
        const shopsSource = this.map.getSource(MAP_IDS.SHOPS_SOURCE);
        shopsSource && shopsSource.setData(newData);
    }

    updateAreaSource() {
        const newSourceData = this.getAreaStoreData(this.props.geoJsonAreas);
        console.log('[map] updatedSource', newSourceData.features[25]);
        this.map.getSource(MAP_IDS.AREA_SOURCE).setData(newSourceData);
    }

    updateWorkIconSource() {
        this.map.jumpTo({center: this.props.workLocation});
        const workSource = this.map.getSource(MAP_IDS.WORK_ICON_SOURCE);
        if (!workSource) {
            this.map.addSource(MAP_IDS.WORK_ICON_SOURCE, {
                type: 'geojson',
                cluster: false,
                data: this.getWorkLocationSourceData()
            });
        } else {
            workSource.setData(this.getWorkLocationSourceData());
        }
    }

    getSelectedAreaData() {
        const item = this.props.geoJsonAreas.find(item => item.id === this.props.selectedQuarter)
        return item ? JSON.parse(item.waygeo) : {
            'type': 'FeatureCollection',
            'features': []
        };
    }

    getWorkLocationSourceData() {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [...this.props.workLocation]
                    }
                }
            ]
        }
    }

    getAreaStoreData(geoJsonAreas) {
        const areas = geoJsonAreas.map(item => {
            const itemObject = JSON.parse(item.waygeo);
            return {
                type: 'Feature',
                geometry: itemObject,
                properties: {
                    id: item.id,
                    score: item.score,
                }
            }
        });

        return {
            type: 'FeatureCollection',
            features: areas,
        };
    }

    render() {
        const style = {
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
        };

        return <div style={style} ref={el => (this.mapContainer = el)}/>;
    }
}


Map.propTypes = {
    geoJsonAreas: PropTypes.array,
    workLocation: PropTypes.arrayOf(PropTypes.number),
    route: PropTypes.object,
    shops: PropTypes.arrayOf(PropTypes.array),
    selectedQuarter: PropTypes.string,

};

export default Map;
