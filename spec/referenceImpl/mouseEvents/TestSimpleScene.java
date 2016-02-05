import junit.framework.TestCase;
import spec.MouseEvent;
import test.TestLog;
import test.TestNode;

public class TestSimpleScene extends TestCase {

    private TestNode scene;
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
        scene = new TestNode("scene", 0, 0, 1000, 1000);
        root = new TestNode("root", 0, 0, 1000, 1000);
        rect = new TestNode("rect", 75, 5, 20, 20);
        root.addChildren(rect);
        scene.addChildren(root);
        log.addTo(root, rect);
    }

    public void testPress() {
        assertDispatchPress(
                76, 6,
                "rect: press@1,1"
        );
    }

    public void testPressOnRootSeveralTimes() {
        rect.presses.clear();

        assertDispatchPress(
                76, 6,
                "root: press@76,6"
        );

        log.clear();

        assertDispatchPress(
                77, 7,
                "root: press@77,7"
        );

        log.clear();

        assertDispatchPress(
                10, 10,
                "root: press@10,10"
        );
    }

    public void testInMoveOut() {
        root.inOuts.clear();
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals(
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: out"
                , log.get());
    }

    public void testInMoveOutWithRoot() {
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals(
                "root: in\n" +
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: out\n" +
                "root: out"
                , log.get());
    }

    public void testInMoveOutTwice() {
        root.inOuts.clear();
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals(
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: out\n" +
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: out"
                , log.get());
    }

    public void testInMoveTwiceOut() {
        root.inOuts.clear();
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(77, 7,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals(
                "rect: in\n" +
                "rect: move@1,1\n" +
                "rect: move@2,2\n" +
                "rect: out"
                , log.get());
    }

    public void testOnlyMove() {
        root.inOuts.clear();
        rect.inOuts.clear();

        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals("rect: move@1,1", log.get());
    }

    public void testPassingMoveToRoot() {
        root.inOuts.clear();
        rect.inOuts.clear();
        rect.moves.clear();

        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals("root: move@10,10\n" +
                     "root: move@76,6\n" +
                     "root: move@10,10", log.get());
    }

    public void testOnlyMouseMoveButTwice() {
        root.inOuts.clear();
        rect.inOuts.clear();

        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(76, 6,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(77, 7,  MouseEvent.Type.move));
        root.dispatch(new MouseEvent(10, 10, MouseEvent.Type.move));

        assertEquals("rect: move@1,1\n" +
                     "rect: move@2,2", log.get());
    }

    public void testHandlingPressOnRoot() {
        rect.presses.clear();

        assertDispatchPress(
                76, 6,
                "root: press@76,6"
        );
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
