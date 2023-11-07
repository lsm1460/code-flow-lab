import { CHART_VARIABLE_ITEMS } from '@/consts/codeFlowLab/items';
import { ChartItemType, PointPos } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction, setFlowLogAction } from '@/reducers/contentWizard/mainDocument';
import {
  getChartItem,
  getConnectOperationsForBlockToBlock,
  getConnectOperationsForCondition,
  getConnectOperationsForVariable,
  getSceneId,
} from '@/utils/content';
import { clearHistory } from '@/utils/history';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FlowChartViewer from '../viewer';
import FlowChart from './flowChart';
import FlowHeader from './flowHeader';
import FlowLog from './flowLog';
import FlowTabs from './flowTabs';
import FlowToolbar from './flowToolbar';
import FlowZoom from './flowZoom';
import FlowOptionModal from './modal/flowOptionModal';

import classNames from 'classnames/bind';
import styles from './editor.module.scss';
const cx = classNames.bind(styles);

export type MoveItems = (_itemIds: string[], _deltaX: number, _deltaY: number) => void;
export type ConnectPoints = (_prev: PointPos, _next?: PointPos, _delete?: PointPos) => void;

function CodeFlowLabEditor() {
  const dispatch = useDispatch();

  const [moveItemInfo, setMoveItemInfo] = useState<{ ids: string[]; deltaX: number; deltaY: number }>(null);

  const { openTime, selectedSceneId, chartItems, sceneItemIds, itemsPos, isModalOpen } = useSelector(
    (state: RootState) => {
      const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

      return {
        openTime: state.openTime,
        chartItems: state.contentDocument.items,
        itemsPos: state.contentDocument.itemsPos,
        selectedSceneId,
        sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds || [],
        isModalOpen: !!state.selectModal,
      };
    },
    shallowEqual
  );

  const selectedChartItem = useMemo(() => getChartItem(sceneItemIds, chartItems), [chartItems, sceneItemIds]);

  useEffect(() => {
    clearHistory();

    dispatch(
      setFlowLogAction({ date: new Date(), text: '코드 플로우 랩에 오신 여러분을 환영합니다.', type: 'system' })
    );
  }, [openTime]);

  useEffect(() => {
    if (moveItemInfo && (moveItemInfo.deltaX || moveItemInfo.deltaY)) {
      const targetItems = _.pickBy(selectedChartItem, (_item) => moveItemInfo.ids.includes(_item.id));

      const operations: Operation[] = Object.values(targetItems).map((_item) => {
        return {
          key: `itemsPos.${_item.id}.${selectedSceneId}`,
          value: {
            left: itemsPos[_item.id][selectedSceneId].left + moveItemInfo.deltaX,
            top: itemsPos[_item.id][selectedSceneId].top + moveItemInfo.deltaY,
          },
        };
      });

      dispatch(setDocumentValueAction(operations));

      setMoveItemInfo(null);
    }
  }, [moveItemInfo, selectedChartItem]);

  const moveItems: MoveItems = (_itemIds, _deltaX, _deltaY) => {
    setMoveItemInfo({ ids: _itemIds, deltaX: _deltaX, deltaY: _deltaY });
  };

  const connectPoints: ConnectPoints = (_prevPos, _nextPos, _deletePos) => {
    let operations: Operation[];

    const targetEltypeList = _.compact([
      selectedChartItem[_prevPos.parentId].elType,
      selectedChartItem[_nextPos?.parentId]?.elType,
      selectedChartItem[_deletePos?.parentId]?.elType,
    ]);

    //_prevPos, _nextPos, _deletePos의 id로 elType을 가져온 후 변수일 경우
    const isIfFlog =
      targetEltypeList.includes(ChartItemType.if) && (_prevPos.isSlave || _nextPos?.isSlave || _deletePos?.isSlave);
    const isVariableFlag = !_.isEmpty(_.intersection(targetEltypeList, CHART_VARIABLE_ITEMS));

    if (isIfFlog) {
      operations = getConnectOperationsForCondition(selectedChartItem, _prevPos, _nextPos, _deletePos);
    } else if (isVariableFlag) {
      operations = getConnectOperationsForVariable(selectedChartItem, _prevPos, _nextPos, _deletePos);
    } else {
      operations = getConnectOperationsForBlockToBlock(selectedChartItem, _prevPos, _nextPos, _deletePos);
    }

    if (operations) {
      dispatch(setDocumentValueAction(operations));
    }
  };

  return (
    <>
      {isModalOpen && <FlowOptionModal />}
      <FlowHeader />
      <div className={cx('editor-wrap')}>
        <FlowToolbar />
        <div className={cx('canvas-area')}>
          <FlowTabs />
          <FlowZoom>
            <FlowChart moveItems={moveItems} connectPoints={connectPoints} />
          </FlowZoom>
          <FlowLog />
        </div>
        <FlowChartViewer />
      </div>
    </>
  );
}

export default CodeFlowLabEditor;
