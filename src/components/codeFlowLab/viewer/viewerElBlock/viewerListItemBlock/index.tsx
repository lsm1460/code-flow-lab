import { ChartListElItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject, useMemo } from 'react';

interface SpanViewerItem extends ViewerItem {
  elId?: ChartListElItem['elId'];
}

interface Props {
  elRef: RefObject<HTMLSpanElement>;
  viewerItem: SpanViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem?: {
    [id: string]: number | string;
  };
}
function ViewerListItemBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem }: Props) {
  const textVariable = useMemo(() => mapItem?.[viewerItem.elId], [mapItem, viewerItem]);

  return (
    <span ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {textVariable}
    </span>
  );
}

export default ViewerListItemBlock;
