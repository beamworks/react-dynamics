const React = require('react');

class TaskState {
    constructor(source, onResult, onCancel) {
        this.source = source;

        // @todo convert to normal methods and avoid pre-binding?
        this.resolve = (v) => {
            onResult(v);
        };

        this.cancel = () => {
            onCancel();
        };
    }
}

// task prompt state, triggered by a function call and resolvable/cancelable
// will wait for result given in state.resolve() to finish, and also for then-prop to finish
class Task extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            promptState: null
        };

        this._isUnmounted = false;
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _activate(activationData) {
        if (this.state.promptState) {
            throw new Error('cannot activate while already active');
        }

        const promptState = new TaskState(activationData, (result) => {
            // check if still relevant (not needing atomic state callback check)
            if (this._isUnmounted || this.state.promptState !== promptState) {
                return;
            }

            // update state and notify callback after state change is done
            const whenStateReset = new Promise(resolve => {
                this.setState({ promptState: null }, () => {
                    resolve();
                });
            });

            whenStateReset.then(() => {
                // read the prop value at the last moment, in case re-render changes it
                if (this.props.then) {
                    return this.props.then(result);
                }
            });
        }, () => {
            // check if still relevant (not needing atomic state callback check)
            if (this._isUnmounted || this.state.promptState !== promptState) {
                return;
            }

            this.setState({ promptState: null });
        });

        this.setState({ promptState: promptState });
    }

    render() {
        return this.props.children(this.state.promptState, this._activate.bind(this));
    }
}

module.exports = Task;
