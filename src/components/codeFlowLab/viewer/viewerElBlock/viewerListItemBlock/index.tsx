import { ChartListElItem, ChartSpanItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import _ from 'lodash';
import { CSSProperties, RefObject, useMemo } from 'react';

interface SpanViewerItem extends ViewerItem {
  elId?: ChartListElItem['elId'];
  useIndex?: ChartListElItem['useIndex'];
}

interface Props {
  elRef: RefObject<HTMLSpanElement>;
  viewerItem: SpanViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem?: {
    [id: string]: number;
  };
}
function ViewerListItemBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem }: Props) {
  const textVariable = useMemo(() => mapItem?.[viewerItem.elId]?.[viewerItem.useIndex ? 1 : 0], [mapItem, viewerItem]);

  return (
    <span ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {textVariable}
    </span>
  );
}

export default ViewerListItemBlock;
