const React = require('react');

const StatusTracker = require('./StatusTracker');

// @todo rename into status
class Notice extends React.PureComponent {
    constructor() {
        super();

        this._itemCount = 0;

        this.state = {
            itemId: null,
            itemValue: null,
            itemDisplay: null
        };
    }

    _inspect(value) {
        // set up new inspectable state, overriding any previous one
        this._itemCount += 1;
        const itemId = this._itemCount;

        const statusTracker = new StatusTracker(null, () => {
            this.setState((state) => {
                if (state.itemId !== itemId) {
                    return {};
                }

                return {
                    itemId: null,
                    itemValue: null,
                    itemDisplay: null
                };
            });
        });

        this.setState({
            itemId: itemId,
            itemValue: value,
            itemDisplay: statusTracker.Component
        });
    }

    render() {
        return this.props.contents(
            this._inspect.bind(this),
            (itemContents) => this.state.itemId !== null
                ? itemContents(this.state.itemValue, this.state.itemDisplay)
                : null,
            this.state.itemId !== null
        );
    }
}

module.exports = Notice;
