import React, {Component} from 'react';
import PropTypes from 'prop-types';



class ProgressBar extends Component {
    render() {
        return (
            <div>
                <div className="progress-line"></div>
            </div>
        );
    }
}

ProgressBar.propTypes = {};

export default ProgressBar;