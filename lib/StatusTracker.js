var React = require('react');

class StatusTracker {
    constructor(startCallback, endCallback) {
        this._refCount = 0;
        this._startCallback = startCallback;
        this._endCallback = endCallback;

        this.Component = this._createStatusComponent((prevActive, nextActive) => {
            this._updateStatus(prevActive, nextActive);
        });
    }

    _updateStatus(prevActive, nextActive) {
        const delta = (prevActive ? -1 : 0) + (nextActive ? 1 : 0);

        this._refCount += delta;

        if (this._refCount === 1 && delta === 1) {
            this._startCallback && this._startCallback();
        } else if (this._refCount === 0 && delta === -1) {
            this._endCallback && this._endCallback();
        }
    }

    _createStatusComponent(processDisplayChange) {
        return class Status extends React.PureComponent {
            componentWillMount() {
                processDisplayChange(false, this.props.on);
            }

            componentWillReceiveProps(nextProps) {
                processDisplayChange(this.props.on, nextProps.on);
            }

            componentWillUnmount() {
                processDisplayChange(this.props.on, false);
            }

            render() {
                return this.props.children ? this.props.children() : null;
            }
        };
    }
}

module.exports = StatusTracker;
