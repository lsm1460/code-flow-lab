import { ChartItem, ChartItemType, ChartStyleItem, ConnectPoint, ViewerItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { getChartItem, getSceneId } from '@/utils/content';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { getBlockType } from '../editor/flowChart/utils';
import ViewerElBlock from './viewerElBlock';

interface Props {}
function FlowChartViewer({}: Props) {
  const { sceneOrder, chartItems, sceneItemIds } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      sceneOrder: state.sceneOrder,
      chartItems: state.contentDocument.items,
      sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds || [],
    };
  }, shallowEqual);

  const selectedChartItem = useMemo(() => getChartItem(sceneItemIds, chartItems), [chartItems, sceneItemIds]);

  const makeStylePropReduce = (_acc = {}, _curPoint: ConnectPoint) => {
    const _childStyle = selectedChartItem[_curPoint.connectParentId].connectionIds.right.reduce(
      makeStylePropReduce,
      {}
    );

    return {
      ..._acc,
      ...(selectedChartItem[_curPoint.connectParentId] as ChartStyleItem).styles,
      ..._childStyle,
    };
  };

  const makeScriptProps = (_chartItem: ChartItem) => {
    let script = [];

    if (_chartItem.elType === ChartItemType.if) {
      script = _chartItem.connectionVariables
        .filter((_var) => _var?.connectType === 'function')
        .map((_point) => makeScriptProps(selectedChartItem[_point.connectParentId]));
    } else {
      script = _chartItem.connectionIds.right.map((_point) =>
        makeScriptProps(selectedChartItem[_point.connectParentId])
      );
    }

    return {
      ..._chartItem,
      script,
    };
  };

  const makeViewerDocument = (_chartItem: ChartItem) => {
    return {
      ..._chartItem,
      styles: _chartItem.connectionIds.right
        .filter((_point) => selectedChartItem[_point.connectParentId].elType === ChartItemType.style)
        .reduce(makeStylePropReduce, {}),
      children: _chartItem.connectionIds.right
        .filter((_point) =>
          [ChartItemType.el, ChartItemType.span].includes(
            getBlockType(selectedChartItem[_point.connectParentId].elType)
          )
        )
        .map((_point) => makeViewerDocument(selectedChartItem[_point.connectParentId])),
      triggers: _chartItem.connectionIds.right
        .filter((_point) => selectedChartItem[_point.connectParentId].elType === ChartItemType.trigger)
        .map((_point) => makeScriptProps(selectedChartItem[_point.connectParentId])),
    };
  };

  const templateDocument: ViewerItem = useMemo(() => {
    const rootId = _.find(selectedChartItem, (_item) => _item.elType === ChartItemType.body).id;

    return makeViewerDocument(selectedChartItem[rootId]);
  }, [selectedChartItem, sceneOrder]);

  return <ViewerElBlock viewerItem={templateDocument} />;
}

export default React.memo(FlowChartViewer);
