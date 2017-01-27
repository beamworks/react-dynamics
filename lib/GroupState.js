const React = require('react');

class GroupState extends React.PureComponent {
    constructor() {
        super();

        // reuse component type reference to help reconciliation
        this._trackerComponent = function Tracker(props) {
            const newData = Object.assign(Object.create(null), props.data);
            newData[props.name] = props.value;

            return props.yield(newData);
        };

        this._reportComponent = function Report(props) {
            return props.contents(props.data);
        };
    }

    render() {
        const Tracker = this._trackerComponent;
        const Report = this._reportComponent;

        const contents = this.props.children;
        const itemMap = this.props.items;
        const itemList = Object.keys(itemMap);

        function getItemYield(index) {
            // at the end of the render chain is the actual contents
            if (index >= itemList.length) {
                return function (data) {
                    return React.createElement(Report, { data: data, contents: contents });
                };
            }

            // regular stack item renders the item payload and tracker
            const name = itemList[index];
            const nestedYield = getItemYield(index + 1);

            return function (data) {
                return itemMap[name](function (value) {
                    return React.createElement(Tracker, { data: data, name: name, value: value, yield: nestedYield });
                });
            };
        }

        return getItemYield(0)(Object.create(null));
    }
}

module.exports = GroupState;
