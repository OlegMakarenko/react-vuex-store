# React Vuex Store

Vuex-style store wrapper for Redux

## Important Notes

Find the complete release notes [here](CHANGELOG.md).

## Requirements

### NodeJS

- NodeJS 10.X.X and above (from v0.18.0)

## Installation

```bash
npm install react-vuex-store
```

## Usage

### Defining the Store
#### Store Module

```ts
import { ReactVuexStore } from 'react-vuex-store';
import { RootStoreState } from '.';

export type ModuleNameStoreState = {
    someStringVariable: string;
};

export default ReactVuexStore.createModule<ModuleNameStoreState, RootStoreState>({
    namespace: 'moduleName',
    state: {
        someStringVariable: 'default variable value',
    },
    mutations: {
        setSomeStringVariable(store, payload: ModuleNameStoreState['someStringVariable']) {
            store.moduleName.someStringVariable = payload;
        }
    },
    actions: {
        asyncAction: async ({ commit }, payload: number): Promise<void> => {
            const someStringVariable = await Service.getStringValue(payload);
    
            commit<ModuleNameStoreState['someStringVariable']>({
                type: 'moduleName/setSomeStringVariable', 
                payload: someStringVariable
            });
        },
    },
});
```

#### Root Store Module

```ts
import moduleNameStore, { ModuleNameStoreState } from './ModuleNameStore';
import { RootModulesType } from './react-vuex-store';

export type RootStoreState = {
    moduleName: ModuleNameStoreState;
};

export const RootModules: RootModulesType<RootStoreState> = {
    moduleName: moduleNameStore
};
```

#### Main Store Export

```ts
import { ReactVuexStore } from 'react-vuex-store';
import { RootModules as modules } from './RootStore';
import type { RootStoreState } from './RootStore';

export { connect } from 'react-redux';
export type { RootStoreState };


export default new ReactVuexStore<RootStoreState>(modules).createStore();
```


### Connect to components

```ts
import React, { useEffect } from 'react';
import store, { connect, RootStoreState } from 'src/store';

interface Props {
    someStringVariable: RootStoreState['moduleName']['someStringVariable'];
}

const FunctionalComponent = (props: Props): JSX.Element => {
    useEffect(() => { 
        store.dispatchAction({type: 'moduleName/asyncAction', payload: 1})
    }, []);
    
    return <div>
        {props.someStringVariable}
    </div>;
}

export default connect((state: RootStoreState) => ({
    someStringVariable: state.moduleName.someStringVariable
}))(FunctionalComponent);
```
