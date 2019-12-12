import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Formik, Form, Field} from 'formik';

import logoImg from '../../Logo-locationeer.png';

class SidePanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
            expanded: false
        }
    }

    componentDidMount() {
        this.props.onPreferencesSubmit(this.props.initialPreferences);
    }

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
                                    <Formik
                                        initialValues={this.props.initialPreferences}
                                        onSubmit={(values) => this.props.onPreferencesSubmit(values)}
                                    >
                                        <Form>
                                            <div className="row">
                                                <div className="col">
                                                    <h6><i className="fas fa-map-marker-alt mr-2"></i>Práca</h6>
                                                    <div className="d-flex flex-column justify-content-between">
                                                        <div className="row">
                                                            <div className="col-6 d-flex">
                                                                <label className="mr-2">N:</label>
                                                                <Field name="geoN" className="form-control" type="number" step="0.01"/>
                                                            </div>
                                                            <div className="col-6 d-flex">
                                                                <label className="mr-2">E:</label>
                                                                <Field name="geoE" className="form-control" type="number" step="0.01"/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <hr/>
                                            <div className="row">
                                                <div className="col">
                                                    <h6>Okolie (km)</h6>
                                                    <div className="d-flex justify-content-between">
                                                        <Field type="number" name="diameter" className="form-control"/>
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="submit" className="btn mt-2 btn-outline-dark">Uložiť zmeny</button>
                                        </Form>
                                    </Formik>

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
    initialPreferences: PropTypes.object,
    onPreferencesSubmit: PropTypes.func,
};

export default SidePanel;