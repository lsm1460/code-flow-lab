import { CHART_ELEMENT_ITEMS } from '@/consts/codeFlowLab/items';
import { RootState } from '@/reducers';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getSceneId } from '@/utils/content';
import _ from 'lodash';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import PropertyBlock from '../propertyBlock';
import { ChartItemType } from '@/consts/types/codeFlowLab';

interface Props {
  id: string;
  elId: string;
  targetElTypeList?: ChartItemType[];
}
function IdSelectBlock({ id, elId, targetElTypeList }: Props) {
  const dispatch = useDispatch();

  const { chartItems, sceneItemIds, selectedGroupId, group } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      sceneId,
      sceneOrder: state.sceneOrder,
      chartItems: state.contentDocument.items,
      sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds || [],
      selectedGroupId: state.selectedGroupId,
      group: state.contentDocument.group,
    };
  }, shallowEqual);

  const valueList = useMemo(() => {
    const selectedChartItem = getChartItem(sceneItemIds, chartItems, selectedGroupId, group);
    const elChartItem = _.pickBy(selectedChartItem, (_item) => {
      const flag1 = CHART_ELEMENT_ITEMS.includes(_item.elType);
      const flag2 = (targetElTypeList || [_item.elType]).includes(_item.elType);

      return flag1 && flag2;
    });

    return _.map(elChartItem, (_item) => ({ value: _item.id, label: _item.name }));
  }, [chartItems, sceneItemIds, selectedGroupId, group]);

  const onChangeValue = (_key: string, _id: string | number) => {
    dispatch(setDocumentValueAction({ key: `items.${id}.elId`, value: _id }));
  };

  return (
    <div>
      <PropertyBlock id={id} propertyKey={'element'} value={elId} onChangeValue={onChangeValue} valueList={valueList} />
    </div>
  );
}

export default IdSelectBlock;
