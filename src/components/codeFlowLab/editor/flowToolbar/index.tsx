import { ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { ChartItemType } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import { useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { makeNewItem } from '../flowChart/utils';
import styles from './flowToolbar.module.scss';
import ToolbarPanel from './panel';
const cx = classNames.bind(styles);

function FlowToolbar() {
  const dispatch = useDispatch();

  const { chartItems, itemsPos, selectedSceneId, sceneItemIds, selectedGroupId, group } = useSelector(
    (state: RootState) => {
      const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

      return {
        chartItems: state.contentDocument.items,
        itemsPos: state.contentDocument.itemsPos,
        selectedSceneId,
        sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds || [],
        selectedGroupId: state.selectedGroupId,
        group: state.contentDocument.group,
      };
    },
    shallowEqual
  );

  const selectedChartItem = useMemo(
    () => getChartItem(sceneItemIds, chartItems, selectedGroupId, group),
    [chartItems, sceneItemIds, selectedGroupId, group]
  );

  const [panel, setPanel] = useState<'element' | 'function' | 'variable' | 'group' | ''>('');

  const makeItem = (_itemType: ChartItemType) => {
    const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);

    const [newFlowItem, pos, newItemId] = makeNewItem(
      zoomArea,
      chartItems,
      selectedChartItem,
      itemsPos,
      _itemType,
      selectedSceneId
    );

    const operations: Operation[] = [
      {
        key: 'items',
        value: {
          ...chartItems,
          [newItemId]: newFlowItem,
        },
      },
      {
        key: `itemsPos`,
        value: {
          ...itemsPos,
          [newItemId]: pos,
        },
      },
    ];

    if (selectedGroupId) {
      operations.push({
        key: `group.${selectedGroupId}`,
        value: [...group[selectedGroupId], newItemId],
      });
    } else {
      operations.push({
        key: `scene.${selectedSceneId}.itemIds`,
        value: [...sceneItemIds, newItemId],
      });
    }

    dispatch(setDocumentValueAction(operations));
  };

  return (
    <div className={cx('toolbar')}>
      <ul>
        <li className={cx('toolbar-item', 'element', { active: panel === 'element' })}>
          <button onClick={() => setPanel((_prev) => (_prev !== 'element' ? 'element' : ''))}>element</button>
        </li>
        <li className={cx('toolbar-item', 'style')}>
          <button onClick={() => makeItem(ChartItemType.style)}>style</button>
        </li>
        <li className={cx('toolbar-item', 'trigger')}>
          <button onClick={() => makeItem(ChartItemType.trigger)}>trigger</button>
        </li>
        <li className={cx('toolbar-item', 'function', { active: panel === 'function' })}>
          <button onClick={() => setPanel((_prev) => (_prev !== 'function' ? 'function' : ''))}>script</button>
        </li>
        <li className={cx('toolbar-item', 'variable', { active: panel === 'variable' })}>
          <button onClick={() => setPanel((_prev) => (_prev !== 'variable' ? 'variable' : ''))}>variable</button>
        </li>
        <li className={cx('toolbar-item', 'group', { active: panel === 'group' })}>
          <button onClick={() => setPanel((_prev) => (_prev !== 'group' ? 'group' : ''))}>group</button>
        </li>
      </ul>

      <ToolbarPanel activePanel={panel} handleClosePanel={() => setPanel('')} />
    </div>
  );
}

export default FlowToolbar;
