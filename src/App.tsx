import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import CodeFlowLabEditor from './components/codeFlowLab/editor';
import './globals.css';
import { RootState } from './reducers';
import { REQUEST_SAVE_PROJECT, SAVE_FILE } from './consts/channel';

export const store = configureStore();

function App() {
  const { ipcRenderer } = window.require('electron');

  ipcRenderer.on(REQUEST_SAVE_PROJECT, (e, msg) => {
    const { contentDocument }: RootState = store.getState();

    ipcRenderer.send(SAVE_FILE, contentDocument);
  });

  return (
    <Provider store={store}>
      <CodeFlowLabEditor />
    </Provider>
  );
}
export default App;
