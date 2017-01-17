const React = require('react');

// @todo report start time?
class FadeState {
    constructor(source, delayMs) {
        this.source = source;
        this.delayMs = delayMs;
    }
}

// @todo: naming: this allows the user to dilly-dally with their intent
// ... so this is a sort of generic intent elongator
// @todo use seconds instead of milliseconds? here and elsewhere too
class Fadeable extends React.PureComponent {
    constructor() {
        super();

        this._isUnmounted = false;

        this.state = {
            activeTimeoutId: null,
            fadeState: null
        };
    }

    componentWillReceiveProps(nextProps) {
        // no need to track transition to "on"
        if (this.props.after && !nextProps.after) {
            // when transitioning to inactive, set up new "trailing" timeout
            this.setState((state) => ({
                activeTimeoutId: this._createTimeout(this.props.delayMs),
                fadeState: new FadeState(this.props.after, this.props.delayMs)
            }));
        }

        // when "until" triggers, clear fade state until next "after"
        if (!this.props.until && nextProps.until) {
            this.setState((state) => ({
                activeTimeoutId: null,
                fadeState: null
            }));
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _createTimeout(delayMs) {
        const timeoutId = setTimeout(() => {
            // ignore if entire instance is obsolete
            if (this._isUnmounted) {
                return;
            }

            // deactivate timeout status if we are still the active one
            // @todo this is sometimes firing after unmount, e.g. when removed via hard conditional
            this.setState((state) => (
                state.activeTimeoutId === timeoutId
                    ? {
                        activeTimeoutId: null,
                        fadeState: null
                    }
                    : {}
            ));
        }, delayMs);

        return timeoutId;
    }

    render() {
        return this.props.contents(this.props.after || this.props.until ? null : this.state.fadeState);
    }
}

module.exports = Fadeable;
