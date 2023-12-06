import { ChartImageItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';

interface ImageViewerItem extends ViewerItem {
  src?: ChartImageItem['src'];
}

interface Props {
  elRef: RefObject<HTMLImageElement>;
  viewerItem: ImageViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  isOnlyViewer: boolean;
}
function ViewerImageBlock({ elRef, viewerItem, triggerProps, addedStyle, isOnlyViewer }: Props) {
  return (
    <img
      ref={elRef}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
      src={`${isOnlyViewer ? '' : 'local://'}${viewerItem.src}`}
    />
  );
}

export default ViewerImageBlock;
