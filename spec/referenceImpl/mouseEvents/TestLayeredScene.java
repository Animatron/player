import junit.framework.TestCase;
import spec.MouseEvent;
import test.TestLog;
import test.TestNode;

public class TestLayeredScene extends TestCase {

    private TestNode root;
    private TestNode e1;
    private TestNode e11;
    private TestNode e12;
    private TestNode e2;
    private TestNode e21;

    private TestLog log;


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
    | |  +- e21 fully covers e2 --                         | |
    | |  |                                                 | |
    | |  |                                                 | |
    | |  |                                              55 | |
    | |  |                                                 | |
    | |  |                                                 | |
    | |  +-----------------------                          | |
    | +----------------------------------------------------+ |
    +--------------------------------------------------------+
 */

    @Override
    protected void setUp() throws Exception {
        log = new TestLog();

        root = new TestNode("root", 0, 0, 100, 100);

        e1 = new TestNode("e1", 0, 0, 100, 50);
        e11 = new TestNode("e11", 0, 0, 50, 50);
        e12 = new TestNode("e12", 75, 5, 5, 5);
        e2 = new TestNode("e2", 0, 45, 100, 55);
        e21 = new TestNode("e21", 0, 0, 100, 55);
        root.addChildren(e1.addChildren(e11, e12), e2.addChildren(e21));

        log.addTo(root, e1, e11, e12, e2, e21);
    }

    @Override
    protected void tearDown() throws Exception {
        log.unsubscribe(root, e1, e11, e12, e2, e21);
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

    public void testMoveDispatchToParent() throws Exception {
        e11.inOuts.clear();
        e1.inOuts.clear();
        root.inOuts.clear();

        assertDispatchMove(
                25, 25,
                "e11: move@25,25"
        );

        e11.moves.clear();
        assertDispatchMove(
                26, 26,
                "e1: move@26,26"
        );

        e1.moves.clear();
        assertDispatchMove(
                25, 25,
                "root: move@25,25"
        );

        root.moves.clear();
        assertDispatchMove(
                25, 25,
                ""
        );
    }

    public void testInOutMove() throws Exception {
        assertDispatchMove(25, 75,
                "root: in\n" +
                "e2: in\n" +
                "e21: in\n" +
                "e21: move@25,30");

        assertDispatchMove(25, 75,
                "");

        assertDispatchMove(26, 76,
                "e21: move@26,31");

        assertDispatchMove(25, 25,
                "e21: out\n" +
                "e2: out\n" +
                "e1: in\n" +
                "e11: in\n" +
                "e11: move@25,25");

        assertDispatchMove(76, 6,
                "e11: out\n" +
                 "e12: in\n" +
                 "e12: move@1,1");

        assertDispatchMove(25, 75,
                "e12: out\n" +
                "e1: out\n" +
                "e2: in\n" +
                "e21: in\n" +
                "e21: move@25,30");
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
            "e12: move@2,2\n" +
            "e12: press@2,2\n" +
            "e12: out\n" +
            "e11: in\n" +
            "e11: move@25,6\n" +
            "e12: release@-50,1"
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
