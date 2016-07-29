import assert from 'assert';
import mixpanel from 'mixpanel-browser';
import mixpanelMiddleware from '../src/';
import sinon from 'sinon';

describe('mixpanelMiddleware', () => {
    let sandbox;
    const mockToken = 'TOKEN';

    const selectors = {
        getPerson(state) {
            const {
                auth: {
                    user: {
                        id,
                        username,
                        firstName,
                        lastName,
                        client: {
                            id: clientId,
                            name: clientName,
                        } = {},
                    } = {},
                },
            } = state;

            return {
                clientId: clientId,
                clientName: clientName,
                $first_name: firstName,
                $last_name: lastName,
                $email: username,
            };
        },

        getUniqueId(state) {
            const {
                auth: {
                    user: {
                        id,
                    } = {},
                },
            } = state;

            return id;
        }
    };

    const nonMixpanelAction = {
        type: 'Action',
    };

    const nonMixpanelActionWithMeta = {
        type: 'Action',
        meta: {
            foo: 'bar',
        },
    };

    const mixpanelActionWithoutProps = {
        type: 'Action',
        meta: {
            mixpanel: true,
        },
    };

    const mixpanelActionWithProps = {
        type: 'Action',
        meta: {
            mixpanel: {
                foo: 'bar',
            },
        },
    };

    const mixpanelActionWithIncrement = {
        type: 'Action',
        meta: {
            mixpanel: {
                foo: 'bar',
            },
            mixpanelIncrement: ['login'],
        },
    };

    const mockUser = {
        id: '1234',
        username: 'foo@bar.com',
        firtName: 'Foo',
        lastName: 'Bar',
        client: {
            id: '5678',
            name: 'foo',
        },
    };

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(mixpanel, 'init');
        sandbox.stub(mixpanel, 'track');
        sandbox.stub(mixpanel, 'identify');

        // Mixpanel doesn't add the people object until it has initiated.
        mixpanel.people = {
            set: sandbox.stub(),
            increment: sandbox.stub(),
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('initialises with the given token', () => {
        mixpanelMiddleware(mockToken);
        assert(mixpanel.init.calledOnce);
        assert(mixpanel.init.calledWith(mockToken));
    });

    describe('middlware function', () => {
        const store = { auth: {} };
        let nextStub;
        let middleware;

        function runMiddleware(action) {
            middleware({ getState: () => store })(nextStub)(action);
            assert(nextStub.calledOnce);
            assert(nextStub.calledWith(action));
        }

        beforeEach(() => {
            nextStub = sandbox.stub();
            middleware = mixpanelMiddleware(mockToken, selectors.getPerson, selectors.getUniqueId);
        });

        it('does not attempt to track an action with no meta', () => {
            runMiddleware(nonMixpanelAction);
            assert(mixpanel.track.notCalled);
        });

        it('does not attempt to track an action with no mixpanel meta', () => {
            runMiddleware(nonMixpanelActionWithMeta);
            assert(mixpanel.track.notCalled);
        });

        it('tracks an action with a mixpanel event without props', () => {
            runMiddleware(mixpanelActionWithoutProps);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[0], mixpanelActionWithoutProps.type);
        });

        it('tracks an action with a mixpanel event with props', () => {
            runMiddleware(mixpanelActionWithProps);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[0], mixpanelActionWithProps.type);
            assert.equal(mixpanel.track.firstCall.args[1].foo, mixpanelActionWithProps.meta.mixpanel.foo);
        });

        it('tracks an increment event with the provided values ', () => {
            runMiddleware(mixpanelActionWithIncrement);
            assert(mixpanel.people.increment.calledOnce);
            assert(mixpanel.people.increment.calledWith(mixpanelActionWithIncrement.meta.mixpanelIncrement));
        });

        describe('with user data', () => {
            beforeEach(() => {
                store.auth.user = mockUser;
            });

            it('adds user data to the request', () => {
                runMiddleware(mixpanelActionWithProps);

                assert.equal(mixpanel.identify.args[0][0], mockUser.id);
                assert(mixpanel.people.set.calledWith({
                    clientId: mockUser.client.id,
                    clientName: mockUser.client.name,
                    $first_name: mockUser.firstName,
                    $last_name: mockUser.lastName,
                    $email: mockUser.username,
                }));
            });
        });
    });
});