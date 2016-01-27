import junit.framework.TestCase;
import spec.MouseEvent;
import spec.Node;
import spec.Point;
import spec.Rectangle;

public class Test extends TestCase {

    private TestNode root;
    private String events;
    private TestNode e1;
    private TestNode e11;
    private TestNode e12;
    private TestNode e2;
    private TestNode e21;


/*
                                100
    +-root---------------------------------------------------+
    | +-e1-------------------------------------------------+ |
    | | +-e11--------------------+      (75,5)             | |
    | | |                        |        +-e12--+         | |
    | | |                        |        |     5|         | |
    | | |                     50 |        +------+      50 | |
    | | |                        |            5            | |
    | | |          50            |                         | |
    | | +------------------------+                         | |
    | +----------------------------------------------------+ |  100
    | +-e2 (0, 45) overlaps with e1------------------------+ |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | |                                                 55 | |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | +----------------------------------------------------+ |
    +--------------------------------------------------------+
 */

    @Override
    protected void setUp() throws Exception {
        root = new TestNode("root", 0, 0, 100, 100);

        e1 = new TestNode("e1", 0, 0, 100, 50);
        e11 = new TestNode("e11", 0, 0, 50, 50);
        e12 = new TestNode("e12", 75, 5, 5, 5);
        e2 = new TestNode("e2", 0, 45, 100, 55);
        e21 = new TestNode("e21", 0, 0, 100, 55);
        root.addChildren(e1.addChildren(e11, e12), e2.addChildren(e21));
    }

    public void testPress() {
        assertDispatchPress(
                25, 25,
                "e11: press@25,25"
        );

        assertDispatchPress(
                75, 25,
                ""
        );

        assertDispatchPress(
                25, 47,
                "e21: press@25,2"
        );
    }

    public void testPressDispatchToParent() throws Exception {
        assertDispatchPress(
                25, 25,
                "e11: press@25,25"
        );

        e11.presses.clear();
        assertDispatchPress(
                25, 25,
                "e1: press@25,25"
        );

        e1.presses.clear();
        assertDispatchPress(
                25, 25,
                "root: press@25,25"
        );

        root.presses.clear();
        assertDispatchPress(
                25, 25,
                ""
        );
    }

    public void testInOut() throws Exception {
        assertDispatchMove(25, 75,
                "root: in\n" +
                "e2: in\n" +
                "e21: in");

        assertDispatchMove(25, 75,
                "");

        assertDispatchMove(26, 76,
                "");

        assertDispatchMove(25, 25,
                "e21: out\n" +
                "e2: out\n" +
                "e1: in\n" +
                "e11: in");

        assertDispatchMove(76, 6,
                "e11: out\n" +
                 "e12: in");

        assertDispatchMove(25, 75,
                "e12: out\n" +
                "e1: out\n" +
                "e2: in\n" +
                "e21: in");
    }

    public void testRelease() throws Exception {
        root.dispatch(new MouseEvent(77, 7, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(77, 7, MouseEvent.Type.press));
        root.dispatch(new MouseEvent(25, 6, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(25, 6, MouseEvent.Type.release));

        assertEquals(
                "root: in\n" +
                        "e1: in\n" +
                        "e12: in\n" +
                        "e12: press@2,2\n" +
                        "e12: out\n" +
                        "e11: in\n" +
                        "e12: release@-50,1"
                , events);
    }

    void assertDispatchPress(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.press);
        root.dispatch(event);
        assertEquals(expected, events != null ? events : "");
        events = null;
    }

    void assertDispatchMove(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.move);
        root.dispatch(event);
        assertEquals(expected, events != null ? events : "");
        events = null;
    }

    class TestNode extends Node {

        String name;
        Rectangle boundsInParent;

        public TestNode(final String name, int x, int y, int width, int height) {
            this.name = name;
            this.boundsInParent = new Rectangle(x, y, width, height);
            onPress(new Listener.Press() {
                @Override
                public void onPress(Point point) {
                    log("press", point);
                }
            }).onRelease(new Listener.Release() {
                @Override
                public void onRelease(Point point) {
                    log("release", point);
                }
            }).onInOut(new Listener.InOut() {
                @Override
                public void onIn() {
                    log("in", null);
                }

                @Override
                public void onOut() {
                    log("out", null);
                }
            }).onMove(new Listener.Move() {
                @Override
                public void onMove(Point point) {
                    log("move", null);
                }
            });
        }

        private void log(String type, Point point) {
            if (events == null) {
                events = "";
            } else {
                events += "\n";
            }
            events = events + name + ": " + type + (point != null ? ("@" + point.x + "," + point.y) : "");
        }

        @Override
        public String toString() {
            return name;
        }

        @Override
        public Point transformToChild(Node child, Point point) {
            TestNode testChild = (TestNode) child;
            return new Point(point.x - testChild.boundsInParent.x, point.y - testChild.boundsInParent.y);
        }

        @Override
        public boolean contains(Point point) {
            return point.x >= 0 && point.x < boundsInParent.width && point.y >= 0 && point.y < boundsInParent.height;
        }

        @Override
        public Point transformToParent(Point point) {
            return new Point(boundsInParent.x + point.x, boundsInParent.y + point.y);
        }
    }
}
