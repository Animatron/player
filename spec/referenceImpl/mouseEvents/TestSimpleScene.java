import junit.framework.TestCase;
import spec.MouseEvent;
import test.TestLog;
import test.TestNode;

public class TestSimpleScene extends TestCase {

    private TestNode root;
    private TestNode rect;

    private TestLog log = new TestLog();


    /*                                                          ∞
        +-root- - - - - - - - - - - - - - - - - - - - - - - - - -
        |
                                            (75,5)
        |                                     +-rect--+
                                              |     20|
        |                                     |       |
                                              +-------+
        |                                         20

      ∞ |
      */

    @Override
    protected void setUp() throws Exception {
        root = new TestNode("root", 0, 0, 1000, 1000);
        rect = new TestNode("rect", 75, 5, 20, 20);
        root.addChildren(rect);
        log.addTo(rect);
    }

    public void testPress() {
        assertDispatchPress(
                76, 6,
                "rect: press@1,1"
        );
    }

    /*public void testPressDispatchToParent() throws Exception {
        assertDispatchPress(
                76, 6,
                "rect: press@1,1"
        );

        rect.presses.clear();
        assertDispatchPress(
                76, 6,
                "root: press@76,6"
        );
    } */

    public void testInOut() {
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals(
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: out\n"
                , log.get());
    }

    void assertDispatchPress(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.press);
        root.dispatch(event);
        assertEquals(expected, log.get());
        log.clear();
    }

    void assertDispatchMove(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.move);
        root.dispatch(event);
        assertEquals(expected, log.get());
        log.clear();
    }



}
