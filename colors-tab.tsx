        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนบน (Header) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PanelLeftClose className="h-5 w-5" />
                  สีส่วนบน (Header)
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีพื้นหลังและข้อความในส่วนหัวของแอป
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="header-bg-color">สีพื้นหลังส่วนบน</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="header-bg-color"
                          value={brandSettings.colors?.headerBackground || "#5d4a4a"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              headerBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.headerBackground || "#5d4a4a" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.headerBackground || "#5d4a4a";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                headerBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="header-text-color">สีข้อความส่วนบน</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="header-text-color"
                          value={brandSettings.colors?.headerText || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              headerText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.headerText || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.headerText || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                headerText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg mt-2" style={{ 
                    background: brandSettings.colors?.headerBackground || "#5d4a4a",
                    color: brandSettings.colors?.headerText || "#ffffff" 
                  }}>
                    <p className="font-medium text-center">ตัวอย่างส่วนบน</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* สีปุ่ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  สีปุ่มและองค์ประกอบ
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีปุ่มหลัก ปุ่มรอง และข้อความบนปุ่ม
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-btn-bg">สีพื้นหลังปุ่มหลัก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="primary-btn-bg"
                          value={brandSettings.colors?.primaryButtonBackground || "#ffd008"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              primaryButtonBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.primaryButtonBackground || "#ffd008" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.primaryButtonBackground || "#ffd008";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                primaryButtonBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="primary-btn-text">สีข้อความปุ่มหลัก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="primary-btn-text"
                          value={brandSettings.colors?.primaryButtonText || "#000000"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              primaryButtonText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.primaryButtonText || "#000000" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.primaryButtonText || "#000000";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                primaryButtonText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-btn-bg">สีพื้นหลังปุ่มรอง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="secondary-btn-bg"
                          value={brandSettings.colors?.secondaryButtonBackground || "#e0e0e0"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              secondaryButtonBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.secondaryButtonBackground || "#e0e0e0" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.secondaryButtonBackground || "#e0e0e0";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                secondaryButtonBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-btn-text">สีข้อความปุ่มรอง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="secondary-btn-text"
                          value={brandSettings.colors?.secondaryButtonText || "#333333"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              secondaryButtonText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.secondaryButtonText || "#333333" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.secondaryButtonText || "#333333";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                secondaryButtonText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 rounded-lg text-center" style={{ 
                      background: brandSettings.colors?.primaryButtonBackground || "#ffd008",
                      color: brandSettings.colors?.primaryButtonText || "#000000" 
                    }}>
                      ปุ่มหลัก
                    </div>
                    <div className="p-3 rounded-lg text-center" style={{ 
                      background: brandSettings.colors?.secondaryButtonBackground || "#e0e0e0",
                      color: brandSettings.colors?.secondaryButtonText || "#333333" 
                    }}>
                      ปุ่มรอง
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* แถบนำทางด้านล่าง */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SquareStack className="h-5 w-5" />
                  แถบนำทางด้านล่าง
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีพื้นหลัง, ข้อความ, ไอคอนของแถบนำทางด้านล่าง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bottom-nav-bg">สีพื้นหลังแถบด้านล่าง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-bg"
                          value={brandSettings.colors?.bottomNavigationBackground || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationBackground || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationBackground || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bottom-nav-text">สีข้อความไม่ได้เลือก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-text"
                          value={brandSettings.colors?.bottomNavigationText || "#9ca3af"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationText || "#9ca3af";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bottom-nav-active-text">สีข้อความที่เลือก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-active-text"
                          value={brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationActiveText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationActiveText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bottom-nav-active-icon">สีไอคอนที่เลือก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-active-icon"
                          value={brandSettings.colors?.bottomNavigationActiveIcon || "#5d4a4a"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationActiveIcon: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationActiveIcon || "#5d4a4a" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationActiveIcon || "#5d4a4a";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationActiveIcon: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-2 p-3 flex justify-around rounded-lg border-t" style={{ 
                    background: brandSettings.colors?.bottomNavigationBackground || "#ffffff",
                    borderColor: brandSettings.colors?.bottomNavigationBorder || "#e5e7eb"
                  }}>
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}></div>
                      <span style={{ color: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}>หน้าหลัก</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationActiveIcon || "#5d4a4a" }}></div>
                      <span style={{ color: brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a" }}>โปรไฟล์</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}></div>
                      <span style={{ color: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}>แชท</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* สีการ์ด */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SquareStack className="h-5 w-5" />
                  สีการ์ดและองค์ประกอบอื่นๆ
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีการ์ด, หัวข้อ, และสีองค์ประกอบอื่นๆ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card-bg">สีพื้นหลังการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-bg"
                          value={brandSettings.colors?.cardBackground || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardBackground || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardBackground || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="card-header-bg">สีพื้นหลังส่วนหัวการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-header-bg"
                          value={brandSettings.colors?.cardHeaderBackground || "#f9fafb"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardHeaderBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardHeaderBackground || "#f9fafb" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardHeaderBackground || "#f9fafb";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardHeaderBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="card-title">สีหัวข้อการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-title"
                          value={brandSettings.colors?.cardTitle || "#1a2942"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardTitle: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardTitle || "#1a2942" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardTitle || "#1a2942";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardTitle: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-2 p-4 border rounded-lg" style={{ 
                    background: brandSettings.colors?.cardBackground || "#ffffff",
                    borderColor: brandSettings.colors?.cardBorder || "#e5e7eb"
                  }}>
                    <div className="p-2 mb-3 rounded" style={{ 
                      background: brandSettings.colors?.cardHeaderBackground || "#f9fafb" 
                    }}>
                      <h3 style={{ 
                        color: brandSettings.colors?.cardTitle || "#1a2942",
                        fontWeight: "bold" 
                      }}>ตัวอย่างหัวข้อการ์ด</h3>
                      <p className="text-sm">คำอธิบายการ์ด</p>
                    </div>
                    <p>เนื้อหาในการ์ด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>