import React, {Component} from 'react';
import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import Map from './components/map/Map';
import SidePanel from "./components/side-panel/SidePanel";
import {isValue, round, safeGet} from "./utils";

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userPreferences: {
                geoN: 41.824625,
                geoE: 12.450698,
                diameter: 50
            },
            selectedParams: {},
            areas: []
        }
    }

    updatePreferences = (newPref) => {
        this.setState({
            userPreferences: {...newPref}
        })
    };

    searchLocations = () => {
        fetch('./api/v1/location/', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify(this.state.userPreferences)
        })
            .then(res => res.json())
            .then((results => {
                // console.log(results);
                this.setState({areas: results});
            }))
            .catch((error) => {
                console.error(error);
            })
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

    getWorkLocation() {
        const userPreferences = this.state.userPreferences;
        const geoN = userPreferences && userPreferences.geoN;
        const geoE = userPreferences && userPreferences.geoE;
        return isValue(geoN) && isValue(geoE) ? [geoE, geoN] : null;
    }

    render() {

        const areasList = this.state.areas.slice(0, 20).map(areaItem => {
            return <a href="#" key={areaItem.id} className="list-group-item list-group-item-action d-flex flex-column">
                <h6 className="mb-1">{areaItem.name}</h6>
                <span className="row">
                    <span className="col-6">
                        <small>schools: {areaItem.schools}</small>
                    </span>
                    <span className="col-6">
                        <small>shops: {areaItem.shops}</small>
                    </span>
                </span>
                <span className="row">
                    <span className="col-6">
                        <small>distance: {round(areaItem.distance / 1000, 2)}km</small>
                    </span>
                    <span className="col-6">
                        <small>airport: {round(areaItem.airportdistance / 1000, 2)}km</small>
                    </span>
                </span>
            </a>
        });

        return (
            <div style={this.wrapperStyles}>
                <div style={this.sidePanelStyles}>
                    <div className="col d-flex flex-column overflow-hidden">
                        <div className="row">
                            <div className="col">
                                <SidePanel
                                    initialPreferences={this.state.userPreferences}
                                    onPreferencesSubmit={this.updatePreferences}
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

                        {areasList && areasList.length > 0 &&
                        <div className="d-flex flex-column flex-fill overflow-hidden">
                            <h5 className="py-2">Výsledky (Top 20):</h5>
                            <div className="list-group overflow-auto">
                                {areasList}
                            </div>
                        </div>}
                    </div>
                </div>
                <div style={this.mapStyles}>
                    <Map
                        geoJsonAreas={this.state.areas}
                        workLocation={this.getWorkLocation()}
                    />
                </div>
            </div>

        );
    }
}
