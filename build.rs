#![allow(unused)]
use std::process::Command;
use std::io;
#[cfg(windows)] use winres::WindowsResource;

fn main() {
    Command::new("packfolder.exe")
      .args(&["sciter", "target/assets.rc", "-binary"])
      .output()
      .expect("Unable to run packfolder.exe!");

    if cfg!(target_os = "windows") {
      WindowsResource::new()
        .set_icon("icon.ico")
        .compile();
    }
}