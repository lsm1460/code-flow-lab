import {
  ChartGroupItem,
  ChartItem,
  ChartItemType,
  ChartStyleItem,
  CodeFlowChartDoc,
  ConnectPoint,
  ViewerItem,
} from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { setDocumentAction } from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getSceneId } from '@/utils/content';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getBlockType } from '../editor/flowChart/utils';
import ViewerElBlock from './viewerElBlock';

interface Props {
  isOnlyViewer?: boolean;
}
function FlowChartViewer({ isOnlyViewer }: Props) {
  const dispatch = useDispatch();

  const { groupRootId, sceneOrder, chartItems, sceneItemIds, selectedGroupId, group } = useSelector(
    (state: RootState) => {
      const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

      return {
        groupRootId: (state.contentDocument.items[state.selectedGroupId] as ChartGroupItem)?.rootId,
        sceneOrder: state.sceneOrder,
        chartItems: state.contentDocument.items,
        sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds || [],
        selectedGroupId: state.selectedGroupId,
        group: state.contentDocument.group,
      };
    },
    shallowEqual
  );

  useEffect(() => {
    if (isOnlyViewer) {
      const script = document.createElement('script');
      script.type = 'text/javascript';

      document.body.appendChild(script);
      script.onload = () => {
        dispatch(setDocumentAction(window.data));
      };
      script.src = './data.js';
    }
  }, [isOnlyViewer]);

  const selectedChartItem = useMemo(
    () => getChartItem(sceneItemIds, chartItems, selectedGroupId, group),
    [chartItems, sceneItemIds, selectedGroupId, group]
  );

  const makeStylePropReduce = (_acc = {}, _curPoint: ConnectPoint, groupId = '') => {
    const _childStyle = chartItems[_curPoint.connectParentId].connectionIds.right.reduce(
      (__acc, __cur) => makeStylePropReduce(__acc, __cur, groupId),
      {}
    );

    return {
      ..._acc,
      ...(chartItems[_curPoint.connectParentId] as ChartStyleItem).styles,
      ..._childStyle,
    };
  };

  const makeScriptProps = (_chartItem: ChartItem, groupId = '') => {
    let script = [];

    if (_chartItem.elType === ChartItemType.if) {
      script = _chartItem.connectionVariables
        .filter((_var) => _var?.connectType === 'function')
        .map((_point) => makeScriptProps(chartItems[_point.connectParentId], groupId));
    } else {
      script = _chartItem.connectionIds.right.map((_point) =>
        makeScriptProps(chartItems[_point.connectParentId], groupId)
      );
    }

    return {
      ..._chartItem,
      script,
    };
  };

  const makeViewerDocument = (_chartItem: ChartItem, groupId = '') => {
    if (groupId && _chartItem.elType === ChartItemType.group) {
      const groupItem = _chartItem as ChartGroupItem;

      _chartItem = chartItems[groupItem.rootId];
    }

    return {
      ..._chartItem,
      styles: _chartItem.connectionIds.right
        .filter((_point) => chartItems[_point.connectParentId].elType === ChartItemType.style)
        .reduce((_acc, _cur) => makeStylePropReduce(_acc, _cur, groupId), {}),
      children: _chartItem.connectionIds.right
        .filter((_point) =>
          [ChartItemType.el, ChartItemType.span].includes(getBlockType(chartItems[_point.connectParentId].elType))
        )
        .map((_point) =>
          makeViewerDocument(
            chartItems[_point.connectParentId],
            chartItems[_point.connectParentId].elType === ChartItemType.group ? _point.connectParentId : groupId
          )
        ),
      triggers: _chartItem.connectionIds.right
        .filter((_point) => chartItems[_point.connectParentId].elType === ChartItemType.trigger)
        .map((_point) => makeScriptProps(chartItems[_point.connectParentId], groupId)),
    };
  };

  const templateDocument: ViewerItem = useMemo(() => {
    const rootId = groupRootId || _.find(selectedChartItem, (_item) => _item.elType === ChartItemType.body).id;

    return makeViewerDocument(chartItems[rootId]);
  }, [selectedChartItem, sceneOrder, chartItems, groupRootId]);

  return <ViewerElBlock viewerItem={templateDocument} isOnlyViewer={isOnlyViewer} />;
}

export default React.memo(FlowChartViewer);
