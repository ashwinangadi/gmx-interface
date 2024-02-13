import "./Tooltip.scss";
import cx from "classnames";
import { useCallback, useState, useRef, MouseEvent, ReactNode, useEffect } from "react";
import { IS_TOUCH } from "config/env";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { DEFAULT_TOOLTIP_POSITION } from "config/ui";

const OPEN_DELAY = 0;
const CLOSE_DELAY = 100;

export type TooltipPosition =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

type Props = {
  handle: ReactNode;
  renderContent: () => ReactNode;
  position?: TooltipPosition;
  trigger?: string;
  className?: string;
  disableHandleStyle?: boolean;
  handleClassName?: string;
  isHandlerDisabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
};

export default function Tooltip({
  handle,
  renderContent,
  position = DEFAULT_TOOLTIP_POSITION,
  trigger = "hover",
  className,
  disableHandleStyle,
  handleClassName,
  isHandlerDisabled,
  openDelay = OPEN_DELAY,
  closeDelay = CLOSE_DELAY,
}: Props) {
  const [visible, setVisible] = useState(false);
  const intervalCloseRef = useRef<ReturnType<typeof setTimeout> | null>();
  const intervalOpenRef = useRef<ReturnType<typeof setTimeout> | null>();

  const handleRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [computedPlacement, setComputedPlacement] = useState<TooltipPosition | undefined>(
    position ?? DEFAULT_TOOLTIP_POSITION
  );

  useEffect(() => {
    if (handleRef.current && popupRef.current) {
      computePosition(handleRef.current, popupRef.current, {
        middleware: [flip(), shift()],
        placement: position,
      }).then(({ placement }) => {
        setComputedPlacement(placement);
      });
    }
  }, [visible, position]);

  const onMouseEnter = useCallback(() => {
    if (trigger !== "hover" || IS_TOUCH) return;
    if (intervalCloseRef.current) {
      clearInterval(intervalCloseRef.current);
      intervalCloseRef.current = null;
    }
    if (!intervalOpenRef.current) {
      intervalOpenRef.current = setTimeout(() => {
        setVisible(true);
        intervalOpenRef.current = null;
      }, openDelay);
    }
  }, [setVisible, intervalCloseRef, intervalOpenRef, trigger, openDelay]);

  const onMouseClick = useCallback(() => {
    if (trigger !== "click" && !IS_TOUCH) return;
    if (intervalCloseRef.current) {
      clearInterval(intervalCloseRef.current);
      intervalCloseRef.current = null;
    }
    if (intervalOpenRef.current) {
      clearInterval(intervalOpenRef.current);
      intervalOpenRef.current = null;
    }

    setVisible(true);
  }, [setVisible, intervalCloseRef, trigger]);

  const onMouseLeave = useCallback(() => {
    intervalCloseRef.current = setTimeout(() => {
      setVisible(false);
      intervalCloseRef.current = null;
    }, closeDelay);
    if (intervalOpenRef.current) {
      clearInterval(intervalOpenRef.current);
      intervalOpenRef.current = null;
    }
  }, [setVisible, intervalCloseRef, closeDelay]);

  const onHandleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  return (
    <span
      className={cx("Tooltip", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onMouseClick}
    >
      <span
        ref={handleRef}
        onClick={onHandleClick}
        className={cx({ "Tooltip-handle": !disableHandleStyle }, [handleClassName], { active: visible })}
      >
        {/* For onMouseLeave to work on disabled button https://github.com/react-component/tooltip/issues/18#issuecomment-411476678 */}
        {isHandlerDisabled ? <div className="Tooltip-disabled-wrapper">{handle}</div> : <>{handle}</>}
      </span>
      {visible && (
        <div ref={popupRef} className={cx(["Tooltip-popup", computedPlacement])}>
          {renderContent()}
        </div>
      )}
    </span>
  );
}
