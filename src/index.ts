import { AnyAction, applyMiddleware, createStore, Store as ReduxStore } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';

interface Store extends ReduxStore {
    dispatchAction: any;
    dispatch: ThunkDispatch<{}, {}, AnyAction>;
}

type SimpleSpread<L, R> = R & Pick<L, Exclude<keyof L, keyof R>>;

type DeepReadOnly<T> = {
    readonly [key in keyof T]: DeepReadOnly<T[key]>;
};

export type RootModulesType<RootStoreState> = {
    [name: string]: StoreModule<RootStoreState>;
};

export type RootStateType = {
    [name: string]: {
        [name: string]: any;
    };
};
export type ReduxAction<Payload = any> = {
    type: string;
    payload?: Payload;
};

export type Mutation<RootStoreState, Payload = any> = (state: RootStoreState, payload?: Payload) => void;

export interface StoreActionParam<RootStoreState> {
    commit: <Payload>(arg: ReduxAction<Payload>) => any;
    dispatchAction: <Payload>(arg: ReduxAction<Payload>) => any;
    state: DeepReadOnly<RootStoreState>;
}

export interface StoreModule<RootStoreState> {
    namespace: string;
    state: {
        [key: string]: any;
    };
    mutations: {
        [key: string]: (state: RootStoreState, payload?: any) => void;
    };
    actions: {
        [key: string]: (context: StoreActionParam<RootStoreState>, payload?: any) => any;
    };
}

export class ReactVuexStore<RootStoreState> {
    private modules: RootModulesType<RootStoreState>;

    constructor(modules: RootModulesType<RootStoreState>) {
        this.modules = modules;
    }

    static createModule<ModuleState, RootStoreState>(
        storeModule: SimpleSpread<StoreModule<RootStoreState>, { state: ModuleState }>,
    ): SimpleSpread<StoreModule<RootStoreState>, { state: ModuleState }> {
        return storeModule;
    }

    createStore(): Store {
        const store = createStore(this.createRootReducer.bind(this), applyMiddleware(thunk));

        (store as Store).dispatchAction = (action: ReduxAction): any => {
            console.log('[Action]', action);

            if (typeof action.type !== 'string') {
                console.error('[Store] Failed to dispatchAction. Type "' + action.type + '" is not a string');
                return;
            }
            const namespace = action.type.split('/')[0];
            const actionA = action.type.split('/')[1];

            if (!this.modules[namespace]) {
                console.error('[Store] Failed to dispatchAction. Module "' + namespace + '" not found');
                return;
            }

            if (typeof this.modules[namespace].actions[actionA] !== 'function') {
                console.error('[Store] Failed to dispatchAction. Action "' + actionA + '" not found');
                return;
            }

            const state = store.getState();

            return (store as Store).dispatch((dispatch) =>
                this.modules[namespace].actions[actionA](
                    {
                        commit: dispatch,
                        state: state as DeepReadOnly<RootStoreState>,
                        dispatchAction: (store as Store).dispatchAction,
                    },
                    action.payload,
                ),
            );
        };

        return store as Store;
    }

    private createModuleReducer(
        module: StoreModule<RootStoreState>,
        state: RootStoreState | object = {},
        action: ReduxAction,
    ): RootStoreState | object {
        if (!(state as RootStateType)[module.namespace]) {
            (state as RootStateType)[module.namespace] = module.state;
        }

        const namespace = action.type.split('/')[0];
        const mutation = action.type.split('/')[1];

        if (module.namespace === namespace && typeof module.mutations[mutation] !== 'function') {
            console.error('[Store] Failed to commit mutation. Type "' + mutation + '" does not exist in "' + namespace + '"');
            return state;
        }
        if (module.namespace === namespace && typeof module.mutations[mutation] === 'function')
            module.mutations[mutation](state as RootStoreState, action.payload);

        return state;
    }

    private createRootReducer(state: RootStoreState | undefined | object = {}, action: ReduxAction): RootStoreState {
        let rootState = { ...state };

        if (typeof action.type !== 'string') {
            console.error('[Store] Failed to commit mutation. Type "' + action.type + '" is not a string');
            return rootState as RootStoreState;
        }

        const namespace = action.type.split('/')[0];

        if (namespace !== '@@redux' && !this.modules[namespace]) {
            console.error('[Store] Failed to commit mutation. Module "' + namespace + '" not found');
            return rootState as RootStoreState;
        }

        if (this.modules) {
            Object.values(this.modules).forEach((module: any) => {
                rootState = {
                    ...rootState,
                    ...this.createModuleReducer(module, state, action),
                };
            });
        }

        return rootState as RootStoreState;
    }
}
