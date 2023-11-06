import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import IpcManager from './components/codeFlowLab/IpcManager';
import CodeFlowLabEditor from './components/codeFlowLab/editor';
import './globals.css';

export const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <IpcManager />
      <CodeFlowLabEditor />
    </Provider>
  );
}
export default App;
