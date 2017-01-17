const React = require('react');

const StatusTracker = require('./StatusTracker');

class Queue extends React.PureComponent {
    constructor() {
        super();

        this._itemCount = 0;

        this.state = {
            itemIdList: [],
            itemValueList: [],
            itemDisplayList: []
        };
    }

    _enqueue(item, whenItemComplete) {
        this._itemCount += 1;
        const itemId = this._itemCount;

        const statusTracker = new StatusTracker(null, () => {
            this.setState((state) => {
                const itemIndex = state.itemIdList.indexOf(itemId);

                if (itemIndex < 0) {
                    throw new Error('unrecognized item ID');
                }

                return {
                    itemIdList: state.itemIdList.slice(0, itemIndex).concat(state.itemIdList.slice(itemIndex + 1)),
                    itemValueList: state.itemValueList.slice(0, itemIndex).concat(state.itemValueList.slice(itemIndex + 1)),
                    itemDisplayList: state.itemDisplayList.slice(0, itemIndex).concat(state.itemDisplayList.slice(itemIndex + 1))
                };
            });
        });

        this.setState((state) => ({
            itemIdList: state.itemIdList.concat([ itemId ]),
            itemValueList: state.itemValueList.concat([ item ]),
            itemDisplayList: state.itemDisplayList.concat([ statusTracker.Component ])
        }));
    }

    render() {
        const itemMapper = (itemContents) => this.state.itemIdList.map((itemId, index) => {
            const itemValue = this.state.itemValueList[index];
            const itemDisplay = this.state.itemDisplayList[index];

            // graft on the item ID as React key
            return React.cloneElement(
                itemContents(itemValue, itemDisplay, index),
                { key: itemId }
            );
        });

        return this.props.contents(
            this._enqueue.bind(this),
            itemMapper,
            this.state.itemIdList.length
        );
    }
}

module.exports = Queue;
