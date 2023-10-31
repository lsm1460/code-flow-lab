import { CHART_ELEMENT_ITEMS } from '@/consts/codeFlowLab/items';
import { ChartItemType } from '@/consts/types/codeFlowLab';
import PanelItemList from '../panelItemList';

function ElementPanel() {
  const itemList = CHART_ELEMENT_ITEMS.filter((_type) => _type !== ChartItemType.body);

  return <PanelItemList itemList={itemList} />;
}

export default ElementPanel;
