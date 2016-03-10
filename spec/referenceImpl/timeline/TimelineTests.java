import org.junit.Test;
import spec.Point;

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;
import static junit.framework.Assert.fail;
import static junit.framework.TestCase.assertEquals;

public class TimelineTests {

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1................................................40]  (100,100) -> (200,200)
     *         e1    [3..........10]                                      (0,0) -> (10,10)
     */
    @Test
    public void testSimpleTicks() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 40));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(3, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(102, 102), c1.position);

        m.tick(1);
        assertEquals(3.0, m.playHead());
        assertEquals(2.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(105, 105), c1.position);

        m.tick(1);
        assertEquals(3.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(107, 107), c1.position);
        assertEquals(new Point(0, 0), e1.position);

        m.tick(7);
        assertEquals(10.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(125, 125), c1.position);
        assertEquals(new Point(10, 10), e1.position);

        m.tick(1);
        assertEquals(11.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(128, 128), c1.position);
    }

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1...6{....11.....16}] band 1,6, loop(3) (100,100) -> (200,200)
     *         e1  [1........10] (0,0) -> (10,10)
     */
    @Test
    public void testSimpleLoops() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 6), new EndAction(EndAction.Type.LOOP, 3));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(1, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);

        m.tick(4);
        assertEquals(5.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(200, 200), c1.position);
        assertEquals(new Point(4, 4), e1.position);

        m.tick(1);
        assertEquals(6.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);
        assertEquals(new Point(5, 5), e1.position);

        m.tick(10);
        assertEquals(15.0, c1.playHead());
        assertFalse(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
    }

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1...6{....11.....16}] band 1,6, bounce(3) (100,100) -> (200,200)
     *         e1  [1........10] (0,0) -> (10,10)
     */
    @Test
    public void testSimpleBounce() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 6), new EndAction(EndAction.Type.BOUNCE, 3));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(1, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);

        m.tick(4);
        assertEquals(5.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(200, 200), c1.position);
        assertEquals(new Point(4, 4), e1.position);

        m.tick(1);
        assertEquals(6.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(180, 180), c1.position);
        assertEquals(new Point(5, 5), e1.position);

        m.tick(10);
        assertEquals(15.0, c1.playHead());
        assertFalse(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
    }

    /**
     *  Movie
     *    s1 dur=50
     *       g1   [10..........30]   group
     *         e1 [10..20]          (0,0) -> (10,10)
     *         e2        [20..30]   (10, 10) -> (0,0)
     */
    @Test
    public void testSimpleGroups() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Group g1 = new Group("g1", new TimeBand(10, 30));
        try {
            g1.addTranslate(new Point(100, 100), new Point(200, 200));
            fail();
        } catch (Exception e) {
        }

        s1.addChild(g1);

        Element e1 = new Element("e1", new TimeBand(10, 20));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        g1.addChild(e1);

        Element e2 = new Element("e2", new TimeBand(20, 30));
        e2.addTranslate(new Point(10, 10), new Point(0, 0));
        g1.addChild(e2);

        // test
        m.tick(9);
        assertEquals(9.0, m.playHead());
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e2));

        m.tick(1);
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertEquals(new Point(0, 0), e1.position);

        m.tick(10);
        assertTrue(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(10, 10), e2.position);

        m.tick(10);
        assertFalse(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(0, 0), e2.position);

        m.tick(1);
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
    }

    /**
     *  Movie
     *    s1 dur=50
     *       g1   [10..........30{...............50.........70}]       group loop(3)
     *         e1 [10..20]       [30..40]       [50..60]               (0,0) -> (10,10)
     *         e2        [20..30]       [40..50]       [60..70]        (10, 10) -> (0,0)
     */
    @Test
    public void testGroupWithLoops() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Group g1 = new Group("g1", new TimeBand(10, 30), new EndAction(EndAction.Type.LOOP, 3));

        s1.addChild(g1);

        Element e1 = new Element("e1", new TimeBand(10, 20));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        g1.addChild(e1);

        Element e2 = new Element("e2", new TimeBand(20, 30));
        e2.addTranslate(new Point(10, 10), new Point(0, 0));
        g1.addChild(e2);

        // test
        m.tick(9);
        assertEquals(9.0, m.playHead());
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e2));

        m.tick(1);
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertEquals(new Point(0, 0), e1.position);

        m.tick(10);
        assertTrue(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(10, 10), e2.position);

        m.tick(11);
        assertEquals(31.0, m.playHead());
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertEquals(new Point(1, 1), e1.position);

        m.tick(10);
        assertEquals(41.0, m.playHead());
        assertFalse(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(9, 9), e2.position);

    }

    /**
     *  Movie
     *    s1 dur=50
     *       g1   [10..........30{...............50.........70}]       group bounce(3)
     *         e1 [10..20]               [40..50][50..60]              (0,0) -> (10,10)
     *         e2        [20..30][30..40]               [60..70]       (10, 10) -> (0,0)
     */
    @Test
    public void testGroupWithBounce() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Group g1 = new Group("g1", new TimeBand(10, 30), new EndAction(EndAction.Type.BOUNCE, 3));

        s1.addChild(g1);

        Element e1 = new Element("e1", new TimeBand(10, 20));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        g1.addChild(e1);

        Element e2 = new Element("e2", new TimeBand(20, 30));
        e2.addTranslate(new Point(10, 10), new Point(0, 0));
        g1.addChild(e2);

        // test
        m.tick(9);
        assertEquals(9.0, m.playHead());
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e2));

        m.tick(1);
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertEquals(new Point(0, 0), e1.position);

        m.tick(10);
        assertEquals(20.0, m.playHead());
        assertTrue(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(10, 10), e2.position);

        m.tick(11);
        assertEquals(31.0, m.playHead());
        assertFalse(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertEquals(new Point(1, 1), e2.position);

        m.tick(10);
        assertEquals(41.0, m.playHead());
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertEquals(new Point(9, 9), e1.position);

    }
}
