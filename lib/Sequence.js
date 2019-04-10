const React = require('react');

function createSequenceStepComponent(parentNode) {
    return class SequenceStep extends React.PureComponent {
        constructor(props) {
            super();

            // pre-computed stack value for child step
            this._childStack = props.stack.concat([ props.value ]);
            this._promptResult = parentNode._getPrompt(props.stack, props.value, this._childStack);
        }

        componentWillReceiveProps(nextProps) {
            // avoid regenerating prompt if props other than stack + value are changed
            if (this.props.stack !== nextProps.stack || this.props.value !== nextProps.value) {
                this._childStack = nextProps.stack.concat([ nextProps.value ]);
                this._promptResult = parentNode._getPrompt(nextProps.stack, nextProps.value, this._childStack);
            }
        }

        render() {
            const prompt = this._promptResult.value;
            const isLast = this._promptResult.done;

            return parentNode._getBody(prompt, isLast ? null : (childValue, extra) => {
                // recurse into next level
                return React.createElement(parentNode._stepComponent, {
                    stack: this._childStack,
                    value: childValue,
                    extra: extra
                });
            }, this.props.extra);
        }
    }
}

// presents a stack of prompts to the user, defined as a re-runnable generator sequence
class Sequence extends React.PureComponent {
    constructor(props) {
        super();

        this._stepComponent = createSequenceStepComponent(this);

        // reuse generator as possible
        this._currentGenerator = null;
        this._nextStack = null;
    }

    _getPrompt(stack, currentValue, nextStack) {
        // restart the generator if needed
        if (this._nextStack !== stack) {
            const generatorThis = this.props.this || null; // convenient "this" reference for generator
            this._currentGenerator = this.props.children.call(generatorThis);

            // pump through the generator prompts until we reach current level
            stack.forEach(cachedValue => {
                this._currentGenerator.next(cachedValue);
            });

            this._nextStack = stack;
        }

        // save expected next stack to avoid unnecessary restarts
        this._nextStack = nextStack;

        return this._currentGenerator.next(currentValue);
    }

    _getBody(prompt, nextRenderer, extra) {
        return this.props.step(prompt, nextRenderer, extra);
    }

    render() {
        return React.createElement(this._stepComponent, {
            stack: [], // pass a new instance of empty array to trigger full re-render
            value: null,
            extra: null
        });
    }
}

module.exports = Sequence;
