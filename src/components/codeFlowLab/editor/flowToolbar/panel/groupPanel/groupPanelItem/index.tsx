import { getCenterPos, getNewPos } from '@/components/codeFlowLab/editor/flowChart/utils';
import { ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { ChartGroupItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import {
  setDeleteTargetIdListAction,
  setDocumentValueAction,
  setOpenedGroupIdListAction,
  setSelectedGroupIdAction,
} from '@/reducers/contentWizard/mainDocument';
import { getGroupItemIdList, getSceneId, makePasteOperations } from '@/utils/content';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styles from './groupPanelItem.module.scss';
const cx = classNames.bind(styles);

interface Props {
  chartItem: ChartGroupItem;
}
function GroupPanelItem({ chartItem }: Props) {
  const dispatch = useDispatch();

  const { chartItems, selectedGroupId, sceneId, flowScene, itemsPos, group, sceneItemIds, openedGroupIdList } =
    useSelector((state: RootState) => {
      const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

      return {
        selectedGroupId: state.selectedGroupId,
        sceneId,
        chartItems: state.contentDocument.items,
        sceneOrder: state.sceneOrder,
        flowScene: state.contentDocument.scene,
        itemsPos: state.contentDocument.itemsPos,
        group: state.contentDocument.group,
        sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds,
        openedGroupIdList: state.openedGroupIdList,
      };
    }, shallowEqual);

  const sceneOrderList = useMemo(
    () =>
      Object.values(flowScene).reduce((_acc, _cur) => {
        if (_cur.itemIds.includes(chartItem.id)) {
          return [..._acc, _cur.order];
        }

        return _acc;
      }, [] as number[]),
    [flowScene]
  );

  const handleMakeNewGroup = () => {
    const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);

    const idList = getGroupItemIdList(group, [chartItem.id]);

    const _items = _.pickBy(chartItems, (_item, _itemId) => idList.includes(_itemId));
    const _itemsPos = _.pickBy(itemsPos, (_item, _itemId) => idList.includes(_itemId));

    const operations = makePasteOperations(
      chartItems,
      itemsPos,
      group,
      _.mapValues(_items, (_item, _itemId) => {
        if (_itemId === chartItem.id) {
          return {
            ..._item,
            name: `Group-${Object.keys(group).length + 1}`,
          };
        }

        return _item;
      }),
      _.mapValues(_itemsPos, (_itemPoses, _itemId) => {
        if (_itemId === chartItem.id) {
          return _.mapValues(_itemPoses, (_pos) => getNewPos(itemsPos, sceneId, getCenterPos(zoomArea)));
        }

        return _itemPoses;
      }),
      {
        [chartItem.id]: group[chartItem.id],
      },
      selectedGroupId,
      sceneId,
      sceneItemIds
    );

    dispatch(setDocumentValueAction(operations));
  };

  const handleEditGroup = () => {
    dispatch(setSelectedGroupIdAction(chartItem.id));

    dispatch(setOpenedGroupIdListAction([...openedGroupIdList, chartItem.id]));
  };

  const handleDeleteGroup = () => {
    if (window.confirm('삭제하시겠습니까?\n해당 그룹에 포함된 블록들이 모두 지워집니다.')) {
      dispatch(setDeleteTargetIdListAction([chartItem.id]));
    }
  };

  return (
    <div className={cx('panel-item')}>
      <p className={cx('panel-title', chartItem.elType)}>
        <span>{chartItem.name}</span>
      </p>

      <ul className={cx('btn-list')}>
        <li>
          <button onClick={handleMakeNewGroup}>Use as a new group</button>
        </li>
        <li>
          <button onClick={handleEditGroup}>Edit group</button>
        </li>
        <li>
          <button onClick={handleDeleteGroup}>Delete group</button>
        </li>
      </ul>

      <div className={cx('panel-desc')}>
        <p className={cx('scene-list-title')}>used scene index list</p>
        <ul className={cx('scene-list')}>
          {sceneOrderList.map((_order) => (
            <li key={_order}>scene-{_order}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GroupPanelItem;
