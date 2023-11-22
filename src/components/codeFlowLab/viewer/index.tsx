import {
  ChartGroupItem,
  ChartItem,
  ChartItemType,
  ChartStyleItem,
  ConnectPoint,
  ViewerItem,
} from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { getChartItem, getSceneId } from '@/utils/content';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { getBlockType } from '../editor/flowChart/utils';
import ViewerElBlock from './viewerElBlock';

interface Props {}
function FlowChartViewer({}: Props) {
  const { sceneOrder, chartItems, sceneItemIds, group } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      sceneOrder: state.sceneOrder,
      chartItems: state.contentDocument.items,
      sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds || [],
      group: state.contentDocument.group,
    };
  }, shallowEqual);

  const selectedChartItem = useMemo(() => getChartItem(sceneItemIds, chartItems), [chartItems, sceneItemIds]);

  const makeStylePropReduce = (_acc = {}, _curPoint: ConnectPoint, groupId = '') => {
    const searchItems = groupId ? group[groupId].items : selectedChartItem;

    const _childStyle = searchItems[_curPoint.connectParentId].connectionIds.right.reduce(
      (__acc, __cur) => makeStylePropReduce(__acc, __cur, groupId),
      {}
    );

    return {
      ..._acc,
      ...(searchItems[_curPoint.connectParentId] as ChartStyleItem).styles,
      ..._childStyle,
    };
  };

  const makeScriptProps = (_chartItem: ChartItem, groupId = '') => {
    const searchItems = groupId ? group[groupId].items : selectedChartItem;

    let script = [];

    if (_chartItem.elType === ChartItemType.if) {
      script = _chartItem.connectionVariables
        .filter((_var) => _var?.connectType === 'function')
        .map((_point) => makeScriptProps(searchItems[_point.connectParentId], groupId));
    } else {
      script = _chartItem.connectionIds.right.map((_point) =>
        makeScriptProps(searchItems[_point.connectParentId], groupId)
      );
    }

    return {
      ..._chartItem,
      script,
    };
  };

  const makeViewerDocument = (_chartItem: ChartItem, groupId = '') => {
    const searchItems = groupId ? group[groupId].items : selectedChartItem;

    if (groupId && _chartItem.elType === ChartItemType.group) {
      const groupItem = _chartItem as ChartGroupItem;
      _chartItem = group[groupId].items[groupItem.rootId];
    }

    return {
      ..._chartItem,
      styles: _chartItem.connectionIds.right
        .filter((_point) => searchItems[_point.connectParentId].elType === ChartItemType.style)
        .reduce((_acc, _cur) => makeStylePropReduce(_acc, _cur, groupId), {}),
      children: _chartItem.connectionIds.right
        .filter((_point) =>
          [ChartItemType.el, ChartItemType.span].includes(getBlockType(searchItems[_point.connectParentId].elType))
        )
        .map((_point) =>
          makeViewerDocument(
            searchItems[_point.connectParentId],
            searchItems[_point.connectParentId].elType === ChartItemType.group ? _point.connectParentId : groupId
          )
        ),
      triggers: _chartItem.connectionIds.right
        .filter((_point) => searchItems[_point.connectParentId].elType === ChartItemType.trigger)
        .map((_point) => makeScriptProps(searchItems[_point.connectParentId], groupId)),
    };
  };

  const templateDocument: ViewerItem = useMemo(() => {
    const rootId = _.find(selectedChartItem, (_item) => _item.elType === ChartItemType.body).id;

    return makeViewerDocument(selectedChartItem[rootId]);
  }, [selectedChartItem, sceneOrder, group]);

  return <ViewerElBlock viewerItem={templateDocument} />;
}

export default React.memo(FlowChartViewer);
