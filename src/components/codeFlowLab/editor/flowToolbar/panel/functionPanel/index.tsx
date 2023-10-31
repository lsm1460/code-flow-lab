import { CHART_SCRIPT_ITEMS } from '@/consts/codeFlowLab/items';
import PanelItemList from '../panelItemList';

function FunctionPanel() {
  return <PanelItemList itemList={CHART_SCRIPT_ITEMS} />;
}

export default FunctionPanel;
