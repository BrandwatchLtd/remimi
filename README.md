# bw-redux-mixpanel-middleware

Brandwatch friendly Redux Mixpanel Middleware. 

# Installation

`npm install --save git+ssh@github.com:BrandwatchLtd/bw-redux-mixpanel-middleware.git`

# Basic Usage

```js
import { createStore } from 'redux';
import mixpanelMiddleware from 'bw-redux-mixpanel-middleware';

import reducer from './your-reducers';

let store = createStore(reducer, ['Initial State'], mixpanelMiddleware(token));
```

This is very basic usage. You want to setup the Profiles for application in production.

# Rule #1 of Mixpanel

Common mistake among mixpanel tracking beginners is tracking everything that happens in your app. 
Avoid doing this mistake and think upfront about story do you want to tell, what are your success criteria. It's easier said than done. 
When you track everything possible, you will have troubles making sense out of your data.
You will realise that you forgot to implement few bits anyway. 

> Don't track everything! 

# Advanced configuration - Profile

> Mixpanel allows you to tie data to a specific user, creating a profile. This is where you store things like their email address, where they came from, or their age.

https://mixpanel.com/help/reference/creating-a-profile

Function (optional) provided as second argument to middleware should be selector returning flat object for given state, see some examples below.
Middlewares requires unique identifier of an user, which is just standard id. Provide function to get the id from state.

```js
const uniqueIdSelector = state => state.me.id; // unique identifier
const personSelector = state => state.me; // data passed down to mixpanel
let store = createStore(reducer, ['Initial State'], mixpanelMiddleware(token, personSelector, uniqueIdSelector));
```

## Audiences example

```js
function getPerson(state) {
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

    const person = {
        clientId: clientId,
        clientName: clientName,
        $first_name: firstName,
        $last_name: lastName,
        $email: username,
    };
}
```

## Mixpanel example format

```js
const data = {
    "$first_name": "Joe",
    "$last_name": "Doe",
    "$created": "2013-04-01T09:02:00",
    "$email": "joe.doe@example.com"
}
```

## Brandwatch Analytics format

```js
const data = {
    $first_name: data.firstName,
    $last_name: data.lastName,
    $username: data.username,
    $email: data.username,
    client: data.client,
    clientId: data.clientId,
    clientStartDate: data.clientStartDate,
    salesForceId: data.salesForceId,
    theme: data.theme,
    role: data.role,
    creationDate: data.creationDate
};
```

## Notes
> Special properties have a leading "$". You shouldn't make up your own property names beginning with "$".

List of special properties
https://mixpanel.com/help/questions/articles/special-or-reserved-properties

# Redux Actions

## Event

```js

const action = {
    type: 'Login',
    meta: {
        mixpanel: { // your data
            source: 'website',
        },
    },
}
```

## Increment

> You can use mixpanel.people.increment to change the current value of numeric properties. This is useful when you want to keep a running tally of things, such as games played, messages sent, or points earned.

```js
// counting logins
const action = {
   type: 'Login',
   meta: {
       mixpanelIncrement: ['login'],
   },
}
```

