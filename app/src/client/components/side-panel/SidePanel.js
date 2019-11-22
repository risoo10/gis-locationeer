import React, {Component} from 'react';
import PropTypes from 'prop-types';

import logoImg from '../../Logo-locationeer.png';

class SidePanel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            radiusInputValue: props.radius,
        }
    }

    onRadiusChange = (newVal) => {
        this.setState({radiusInputValue: +newVal})
    };

    emitRadiusChange = () => {
        this.props.onRadiusChange(this.state.radiusInputValue);
    };

    toggleExpanded = () => {
        this.setState({expanded: !this.state.expanded});
    };

    logoStyles = {
        maxWidth: "100%",
        height: "auto"
    };

    render() {
        return (
            <div>
                <div className="row">
                    <div className="col py-2 mb-2">
                        <img src={logoImg} style={this.logoStyles} alt="Logo"/>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <div className="card">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col d-flex flex-row justify-content-between">
                                        <h5 className="card-title m-0">Konfigurácia </h5>
                                        {
                                            !this.state.expanded ?
                                                <a onClick={this.toggleExpanded}><i className="fas fa-chevron-down"></i></a> :
                                                <a onClick={this.toggleExpanded}><i
                                                    className="fas fa-chevron-up"></i></a>
                                        }
                                    </div>
                                </div>
                                {this.state.expanded && <div>
                                    <hr/>
                                    <div className="row">
                                        <div className="col">
                                            <h6><i className="fas fa-map-marker-alt mr-2"></i>Práca</h6>
                                            <div className="d-flex justify-content-between">
                                                <span>{this.props.workLocation}</span>
                                                <button className="btn btn-outline-dark">Vybrať z mapy</button>
                                            </div>
                                        </div>
                                    </div>
                                    <hr/>
                                    <div className="row">
                                        <div className="col">
                                            <h6>Okolie (km)</h6>
                                            <div className="d-flex justify-content-between">
                                                <input type="number" value={this.state.radiusInputValue}
                                                       onInput={(event) => this.onRadiusChange(event.target.value)}
                                                       onBlur={this.emitRadiusChange}
                                                       className="form-control"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

SidePanel.propTypes = {
    workLocation: PropTypes.string,
    radius: PropTypes.number,
    onRadiusChange: PropTypes.func
};

export default SidePanel;