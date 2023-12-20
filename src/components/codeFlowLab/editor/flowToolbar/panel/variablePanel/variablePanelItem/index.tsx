import { ChartArrayItem, ChartItemType, ChartVariableItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import TextEditBlock from '../../../../flowChart/chartItem/propertiesEditBlock/textEditBlock';
import styles from './variablePanelItem.module.scss';
import { ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { getCenterPos, getNewPos } from '@/components/codeFlowLab/editor/flowChart/utils';
const cx = classNames.bind(styles);

interface Props {
  chartItem: ChartVariableItem | ChartArrayItem;
}
function VariablePanelItem({ chartItem }: Props) {
  const dispatch = useDispatch();

  const { selectedGroupId, sceneId, flowScene, flowItemsPos, group, chartItems } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      selectedGroupId: state.selectedGroupId,
      sceneId,
      sceneOrder: state.sceneOrder,
      flowScene: state.contentDocument.scene,
      flowItemsPos: state.contentDocument.itemsPos,
      group: state.contentDocument.group,
      chartItems: state.contentDocument.items,
    };
  }, shallowEqual);

  const sceneOrderList = useMemo(() => {
    const _sceneList = Object.values(flowScene).reduce((_acc, _cur) => {
      if (_cur.itemIds.includes(chartItem.id)) {
        return [..._acc, `scene-${_cur.order}`];
      }

      return _acc;
    }, [] as string[]);

    const _grouplist = Object.keys(group).reduce((_acc, _cur) => {
      if (group[_cur].includes(chartItem.id)) {
        return [..._acc, chartItems[_cur].name];
      }

      return _acc;
    }, [] as string[]);

    return [..._sceneList, ..._grouplist];
  }, [flowScene, group, chartItems]);

  const editBlock = useMemo(() => {
    if (chartItem.elType === ChartItemType.array) {
      return [...chartItem.list, ''].map((_var, _i) => (
        <TextEditBlock key={_i} id={chartItem.id} text={_var} propertyKey={`list.${_i}`} />
      ));
    } else {
      return <TextEditBlock id={chartItem.id} text={chartItem.var} propertyKey="var" />;
    }
  }, [chartItem]);

  const handleAddItemToCurrentScene = () => {
    const isAlreadyFlag = selectedGroupId
      ? group[selectedGroupId].includes(chartItem.id)
      : flowScene[sceneId].itemIds.includes(chartItem.id);

    if (isAlreadyFlag) {
      return;
    }

    const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);

    const newPos = getNewPos(flowItemsPos, sceneId, getCenterPos(zoomArea));

    const operation: Operation[] = [
      {
        key: `itemsPos.${chartItem.id}`,
        value: {
          ...flowItemsPos[chartItem.id],
          [selectedGroupId || sceneId]: newPos,
        },
      },
    ];

    if (selectedGroupId) {
      operation.push({
        key: `group.${selectedGroupId}`,
        value: _.uniq([...group[selectedGroupId], chartItem.id]),
      });
    } else {
      operation.push({
        key: `scene.${sceneId}.itemIds`,
        value: _.uniq([...flowScene[sceneId].itemIds, chartItem.id]),
      });
    }

    dispatch(setDocumentValueAction(operation));
  };

  return (
    <div className={cx('panel-item')} onClick={handleAddItemToCurrentScene}>
      <p className={cx('panel-title', ChartItemType.variable)}>
        <span>{chartItem.name}</span>
      </p>
      <div className={cx('panel-desc')}>
        {editBlock}

        <p className={cx('scene-list-title')}>used scene index list</p>
        <ul className={cx('scene-list')}>
          {sceneOrderList.map((_order) => (
            <li key={_order}>{_order}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default VariablePanelItem;
