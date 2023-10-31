import { all } from 'redux-saga/effects';
import { mainDocumentReducer } from './contentWizard';
import documentSaga from './contentWizard/mainDocument/sagas';

const rootReducer = mainDocumentReducer;

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;

export function* rootSaga() {
  yield all([documentSaga()]);
}
