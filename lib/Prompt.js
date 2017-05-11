const React = require('react');

class PromptState {
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

// prompt state, triggered by a function call and resolvable/cancelable as a promise
// @todo catch simple rejections to avoid polluting console log?
// @todo default missing active to true
// @todo report state, including start time
class Prompt extends React.PureComponent {
    constructor(props) {
        super();

        if (!props.hasOwnProperty('on')) {
            throw new Error('the "on" property is required');
        }

        this.state = {
            promptState: null
        };
    }

    _activate() {
        if (!this.props.on) {
            throw new Error('cannot activate while disabled');
        }

        if (this.state.promptState) {
            throw new Error('cannot activate while already active');
        }

        return new Promise((resolve, reject) => {
            var promptState = new PromptState(this.props.on, (resultValue, isSuccessful) => {
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

    componentWillReceiveProps(nextProps) {
        // when transitioning to inactive, or when active value changes, clear existing prompt state
        // @todo cancel existing prompt?
        if (this.props.on && (this.props.on !== nextProps.on)) {
            this.setState({ promptState: null });
        }
    }

    render() {
        return this.props.children(this.state.promptState, this._activate.bind(this));
    }
}

module.exports = Prompt;
