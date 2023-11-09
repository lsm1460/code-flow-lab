import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import IpcManager from './components/codeFlowLab/IpcManager';
import DragArea from './components/codeFlowLab/dragArea';
import CodeFlowLabEditor from './components/codeFlowLab/editor';
import './globals.css';

export const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <IpcManager />
      <DragArea />
      <CodeFlowLabEditor />
    </Provider>
  );
}
export default App;
