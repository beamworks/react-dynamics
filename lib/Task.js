const React = require('react');

class TaskState {
    constructor(source, onResult) {
        this.source = source;

        this.resolve = (v) => {
            onResult(v, true);
        };

        this.cancel = (v) => {
            onResult(v, false);
        };
    }
}

// task prompt state, triggered by a function call and resolvable/cancelable as a promise
// @todo catch simple rejections to avoid polluting console log?
// @todo cancel promise on unmount? need to be careful around setState invocations
class Task extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            promptState: null
        };
    }

    _activate(activationData) {
        if (this.state.promptState) {
            throw new Error('cannot activate while already active');
        }

        return new Promise((resolve, reject) => {
            var promptState = new TaskState(activationData, (resultValue, isSuccessful) => {
                this.setState((state) => (state.promptState === promptState ? { promptState: null } : null));

                if (isSuccessful) {
                    resolve(resultValue);
                } else {
                    reject(resultValue);
                }
            });

            this.setState({ promptState: promptState });
        });
    }

    render() {
        return this.props.children(this.state.promptState, this._activate.bind(this));
    }
}

module.exports = Task;
