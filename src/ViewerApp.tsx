import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import FlowChartViewer from './components/codeFlowLab/viewer';
import './globals.css';

export const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <FlowChartViewer isOnlyViewer />
    </Provider>
  );
}
export default App;
