import { ChartImageItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import CUSTOM_PROTOCOL from '@/consts/protocol.js';

interface ImageViewerItem extends ViewerItem {
  src?: ChartImageItem['src'];
}

interface Props {
  elRef: RefObject<HTMLImageElement>;
  viewerItem: ImageViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
}
function ViewerImageBlock({ elRef, viewerItem, triggerProps, addedStyle }: Props) {
  return (
    <img
      ref={elRef}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
      src={`${CUSTOM_PROTOCOL}://${viewerItem.src}`}
    />
  );
}

export default ViewerImageBlock;
