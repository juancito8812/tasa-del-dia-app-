import sys
import os
import traceback
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

if __name__ == "__main__":
    try:
        from winup_app.app import App
        from PySide6.QtWidgets import QApplication, QMainWindow

        app = QApplication(sys.argv)
        main_widget = App()
        main_window = QMainWindow()
        main_window.setCentralWidget(main_widget)
        main_window.setWindowTitle("Tasa del Dia -- Venezuela")
        main_window.setMinimumSize(480, 680)
        main_window.resize(500, 750)
        main_window.show()
        sys.exit(app.exec())
    except Exception:
        err_path = os.path.join(os.environ.get("TEMP", os.getcwd()), "tasa_winup_error.log")
        with open(err_path, "w") as f:
            f.write(f"PID: {os.getpid()}\n")
            traceback.print_exc(file=f)
        raise
