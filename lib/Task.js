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

        // stable reference to activation handler to avoid triggering prop changes for children
        this._activationHandler = this._activate.bind(this);
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    activate(activationData) {
        // public instance-based access to activate this task
        this._activate(activationData);
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

            // notify parent callback before re-rendering
            if (this.props.then) {
                this.props.then(result);
            }

            // state update with safety check in case parent callback caused changes
            if (!this._isUnmounted) {
                this.setState((state) => state.promptState === promptState ? { promptState: null } : null);
            }
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
        return this.props.children(this.state.promptState, this._activationHandler);
    }
}

module.exports = Task;
