import React, {Component} from 'react';
import mapboxgl from 'mapbox-gl';
import PropTypes from "prop-types";

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

class Map extends Component {

    loadMap() {
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [17.063878, 48.158900],
            zoom: [10]
        });

        this.map.on('load', () => {
            this.map.addSource(
                'areas', {
                    type: 'geojson',
                    data: this.getAreaStoreData(this.props.geoJsonAreas)
                }
            );

            this.map.addLayer({
                id: 'area-layer',
                type: 'fill',
                source: 'areas',
                layout: {},
                paint: {
                    "fill-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "area"],
                        100000, "#1c6ff8",
                        5000000, "#31DB92",
                        100000000, "#fef720"
                    ],
                    'fill-opacity': 0.5,
                    'fill-outline-color': 'black',
                }
            })
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.geoJsonAreas !== this.props.geoJsonAreas) {
            this.updateAreaSource();
        }
    }

    updateAreaSource() {
        const newSourceData = this.getAreaStoreData(this.props.geoJsonAreas);
        const sampleCoordinates = newSourceData.features[25].geometry.coordinates[0][0];
        console.log('[map] updatedSource', newSourceData.features[25]);
        this.map.getSource('areas').setData(newSourceData);
        this.map.jumpTo({center: sampleCoordinates});
    }

    componentDidMount() {
        this.loadMap();
    }

    componentWillUnmount() {
        this.map.remove();
    }

    getAreaStoreData(geoJsonAreas) {
        const areas = geoJsonAreas.map(item => {
            const itemObject = JSON.parse(item.waygeo);
            return {
                type: 'Feature',
                geometry: itemObject,
                properties: {
                    area: item.area,
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
    onWorkLocationUpdate: PropTypes.func,
    selectingWorkLocation: PropTypes.bool,
    geoJsonAreas: PropTypes.array
};

export default Map;
