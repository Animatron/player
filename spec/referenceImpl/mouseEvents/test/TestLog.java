package test;

import spec.Node;
import spec.Point;

/**
 * @author Anton Kotenko <shaman.sir@gmail.com>
 * @date 03 Feb 2016
 * © Animatron, 2011-2015
 */
public class TestLog {

    private String events;

    public TestLog() {
        events = "";
    }

    public void addTo(Node... node) {
        for (final Node each : node) {
            each.onPress(new Node.Listener.Press() {
                @Override
                public void onPress(Point point) {
                    log(each, "press", point);
                }
            }).onRelease(new Node.Listener.Release() {
                @Override
                public void onRelease(Point point) {
                    log(each, "release", point);
                }
            }).onInOut(new Node.Listener.InOut() {
                @Override
                public void onIn() {
                    log(each, "in", null);
                }

                @Override
                public void onOut() {
                    log(each, "out", null);
                }
            }).onMove(new Node.Listener.Move() {
                @Override
                public void onMove(Point point) {
                    log(each, "move", point);
                }
            });
        }
    }

    private void log(Node node, String type, Point point) {
        if (!events.isEmpty()) {
            events += "\n";
        }
        events = events + node.name + ": " + type + (point != null ? ("@" + point.x + "," + point.y) : "");
    }

    public String get() {
        return events;
    }

    public void clear() {
        this.events = "";
    }

}
