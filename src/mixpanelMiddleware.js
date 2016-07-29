import mixpanel from 'mixpanel-browser';

export default function mixpanelMiddleware(token, getPerson, getUniqueId) {
    mixpanel.init(token);

    return store => next => action => {
        const {
            type,
            meta: {
                mixpanel: data,
                mixpanelIncrement: increment,
            } = {},
        } = action;

        if (data) {
            if (getPerson && getUniqueId) {
                const person = getPerson(store.getState());
                mixpanel.identify(getUniqueId(store.getState()));
                mixpanel.people.set(person);
            }

            mixpanel.track(type, {
                ...(typeof data === 'object') ? data : {},
            });
        }

        if (increment && increment.length > 0) {
            mixpanel.people.increment(increment);
        }

        return next(action);
    };
}