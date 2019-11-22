import React, {Component} from 'react';
import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import Map from './components/map/Map';
import SidePanel from "./components/side-panel/SidePanel";

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectingWorkLocation: false,
            workLocation: null,
            radius: 50,
            selectedParams: {},
            areas: []
        }
    }

    searchLocations = () => {
        fetch('./api/v1/location/')
            .then(res => res.json())
            .then((results => {
                console.log(results);
                this.setState({areas: results});
            }))
            .catch((error) => {
                console.error(error);
            })
    };

    onSelectWorkLocation() {
        this.setState({selectingWorkLocation: true})
    }

    onUpdateWorkLocation(newLocation) {
        this.setState({workLocation: newLocation, selectingWorkLocation: false});
    }

    onRadiusUpdate = (newRadius) => {
        this.setState({radius: newRadius});
    };

    wrapperStyles = {
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row'
    };

    mapStyles = {
        position: 'relative',
        display: 'block',
        flex: 3,
    };

    sidePanelStyles = {
        display: 'flex',
        minWidth: '350px',
        flex: 1
    };

    render() {

        const areasList = this.state.areas.map(areaItem => {
            return <a href="#" key={areaItem.id} className="list-group-item list-group-item-action d-flex flex-column">
                <h6 className="mb-1">{areaItem.name}</h6>
                <small>type: {areaItem.place}</small>
                <small>area: {areaItem.area}</small>
            </a>
        });

        return (
            <div style={this.wrapperStyles}>
                <div style={this.sidePanelStyles}>
                    <div className="col d-flex flex-column overflow-hidden">
                        <div className="row">
                            <div className="col">
                                <SidePanel
                                    onWorkLocationSelection={this.onSelectWorkLocation}
                                    onRadiusChange={this.onRadiusUpdate}
                                    workLocation={this.state.workLocation}
                                    radius={this.state.radius}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col p-3 text-center">
                                <button type="button" className="btn btn-warning" onClick={this.searchLocations}>Nájsť
                                    lokality
                                </button>
                            </div>
                        </div>

                        {areasList && areasList.length > 0 && <div className="d-flex flex-column flex-fill overflow-hidden">
                            <h5 className="py-2">Výsledky:</h5>
                            <div className="list-group overflow-auto">
                                {areasList}
                            </div>
                        </div>}
                    </div>
                </div>
                <div style={this.mapStyles}>
                    <Map
                        onWorkLocationUpdate={this.onUpdateWorkLocation}
                        selectingWorkLocation={this.state.selectingWorkLocation}
                        geoJsonAreas={this.state.areas}
                    />
                </div>
            </div>

        );
    }
}
