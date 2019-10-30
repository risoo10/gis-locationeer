import React, {Component} from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

class Map extends Component {

    loadMap() {
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [17.063878, 48.158900],
            zoom: [10]
        });
    }

    componentDidMount() {
        fetch('/api/v1/map/available')
            .then(res => res.json())
            .then(res => {
                if (res.available) {
                    this.loadMap();

                    fetch('/api/v1/map/upload-finished', { method: 'POST' })
                        .then(res => res.json())
                        .then(() => console.log('Map load registered.'))

                }
            });
    }

    componentWillUnmount() {
        this.map.remove();
    }

    render() {
        const style = {
            position: 'block',
            width: '100%',
            height: '500px'
        };

        return <div style={style} ref={el => (this.mapContainer = el)}/>;
    }
}

export default Map;
